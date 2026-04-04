# 模板系统后端实现方案

## Context

实现 REQUIREMENTS.md 第 2.6 章节的模板系统后端功能。用户需要通过上传截图+文字描述，由 LLM 生成布局 DSL JSON，同时支持用户手动调整（自然语言或直接编辑 JSON），再由 LLM 校验修正。

**核心价值**：
- 降低模板创建门槛，无需手工编写复杂 DSL
- 支持灵活的人机协作编辑模式
- 为后续 AI Agent 自动选择布局提供基础设施

**用户决策**：
- AI 策略：LLM 生成 + 用户可调整 + LLM 校验
- 存储：本地文件系统
- 模型关系：LayoutPattern 和 Template 独立使用
- 容错：重试 3 次 + 降级到手动编辑

---

## 技术方案

### 1. API 端点设计

#### 1.1 布局模式管理（LayoutPattern）

```
GET    /api/v1/layout-patterns              # 列表（支持分类过滤）
GET    /api/v1/layout-patterns/:id           # 详情
POST   /api/v1/layout-patterns               # 创建（手动或AI生成）
PATCH  /api/v1/layout-patterns/:id           # 更新
DELETE /api/v1/layout-patterns/:id           # 删除
POST   /api/v1/layout-patterns/:id/validate  # LLM 校验和修正
```

#### 1.2 文件上传

```
POST   /api/v1/uploads/layout-image          # 上传参考截图
```

#### 1.3 请求/响应结构

**创建布局模式（支持两种模式）**：

```go
type CreateLayoutPatternRequest struct {
    // 模式1：AI生成
    Mode        string  `json:"mode" binding:"required,oneof=ai manual"` // "ai" 或 "manual"
    Name        string  `json:"name" binding:"required"`
    Description *string `json:"description"`
    Category    string  `json:"category" binding:"required,oneof=content cover section conclusion"`
    
    // AI模式必填
    ImageURL    *string `json:"imageUrl"`      // 参考截图URL
    UserPrompt  *string `json:"userPrompt"`    // 用户描述
    
    // Manual模式必填
    PatternJson *string `json:"patternJson"`   // 手动编写的DSL
}
```

**校验和修正**：

```go
type ValidateLayoutPatternRequest struct {
    PatternJson  string  `json:"patternJson" binding:"required"`  // 用户修改后的DSL
    UserFeedback *string `json:"userFeedback"`                    // 自然语言反馈
}

type ValidateLayoutPatternResponse struct {
    Valid        bool    `json:"valid"`
    CorrectedDSL string  `json:"correctedDsl"`
    Issues       []Issue `json:"issues"`
    Suggestions  *string `json:"suggestions"`
}

type Issue struct {
    Field    string `json:"field"`
    Message  string `json:"message"`
    Severity string `json:"severity"` // "error", "warning"
}
```

---

### 2. 数据模型优化

**LayoutPattern 模型调整**（需要添加字段）：

```go
type LayoutPattern struct {
    ID          string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
    Name        string         `gorm:"not null" json:"name"`
    Description *string        `gorm:"type:text" json:"description"`
    Category    string         `gorm:"not null;index" json:"category"` // 添加索引
    ImageURL    *string        `json:"imageUrl"`
    PatternJson string         `gorm:"type:text;not null" json:"patternJson"`
    
    // 新增字段
    CreatedBy   string         `gorm:"default:'ai'" json:"createdBy"` // "ai" 或 "manual"
    Version     int            `gorm:"default:1" json:"version"`      // 版本号
    
    CreatedAt   time.Time      `json:"createdAt"`
    UpdatedAt   time.Time      `json:"updatedAt"`
    DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
```

**布局 DSL 标准格式**：

```json
{
  "layoutId": "left-image-right-list",
  "name": "左图右列表",
  "category": "content",
  "description": "左侧大图，右侧标题+要点列表",
  "canvas": {"width": 1920, "height": 1080},
  "regions": [
    {
      "id": "left-image",
      "type": "image",
      "bounds": {"x": 60, "y": 150, "width": 850, "height": 800},
      "constraints": {"aspectRatio": "16:9", "minWidth": 400}
    },
    {
      "id": "right-content",
      "type": "container",
      "bounds": {"x": 1010, "y": 150, "width": 850, "height": 800},
      "slots": [
        {"id": "title", "type": "text", "maxLines": 2, "fontSize": 32},
        {"id": "bullets", "type": "bullet-list", "maxItems": 5, "fontSize": 24}
      ]
    }
  ],
  "styles": {
    "fontFamily": "Inter",
    "primaryColor": "#004ac6",
    "backgroundColor": "#ffffff"
  }
}
```

---

### 3. LLM 服务层设计

#### 3.1 目录结构

```
backend-go/internal/services/llm/
├── client.go      # LLM HTTP 客户端封装
├── config.go      # 配置管理
├── layout.go      # 布局 DSL 生成和校验
├── types.go       # 请求/响应类型
└── prompts.go     # Prompt 模板
```

#### 3.2 核心接口

```go
// client.go
type LLMClient struct {
    baseURL     string
    apiKey      string
    model       string
    visionModel string
    timeout     time.Duration
    httpClient  *http.Client
    semaphore   chan struct{} // 并发控制
}

func NewLLMClient(config *Config) *LLMClient
func (c *LLMClient) ChatCompletion(req *ChatRequest) (*ChatResponse, error)
func (c *LLMClient) ChatCompletionWithRetry(req *ChatRequest, maxRetries int) (*ChatResponse, error)

// layout.go
type LayoutService struct {
    client *LLMClient
}

func (s *LayoutService) GenerateDSL(imageURL, userPrompt, category string) (string, error)
func (s *LayoutService) ValidateDSL(dslJson, userFeedback string) (*ValidationResult, error)
func (s *LayoutService) CorrectDSL(dslJson, userFeedback string) (string, error)
```

#### 3.3 Prompt 工程

**System Prompt（DSL 生成）**：

```
你是一个专业的PPT布局设计专家。根据用户提供的参考截图和描述，生成结构化的布局DSL。

输出要求：
1. 严格按照JSON格式输出，不要包含任何解释文字
2. 必须包含字段：layoutId, name, category, description, canvas, regions
3. regions 数组定义页面区域，每个region包含：id, type, bounds
4. bounds 使用绝对坐标，canvas默认1920x1080
5. type支持：image, text, container, bullet-list, chart, table

示例输出：
{
  "layoutId": "...",
  "name": "...",
  "category": "content",
  "canvas": {"width": 1920, "height": 1080},
  "regions": [...]
}
```

**User Prompt（DSL 生成）**：

```
参考截图：[图片]
用户描述：{userPrompt}
分类：{category}

请分析截图的布局结构，结合用户描述，生成对应的布局DSL JSON。
```

**System Prompt（DSL 校验）**：

```
你是一个布局DSL校验专家。检查用户提供的DSL是否符合规范，并根据反馈进行修正。

校验规则：
1. 必须包含必填字段
2. bounds坐标不能超出canvas范围
3. region的id必须唯一
4. type必须是支持的类型

输出JSON格式：
{
  "valid": true/false,
  "correctedDsl": {...},
  "issues": [{"field": "...", "message": "...", "severity": "error/warning"}],
  "suggestions": "..."
}
```

#### 3.4 重试机制

```go
func (c *LLMClient) ChatCompletionWithRetry(req *ChatRequest, maxRetries int) (*ChatResponse, error) {
    var lastErr error
    for i := 0; i < maxRetries; i++ {
        resp, err := c.ChatCompletion(req)
        if err == nil {
            return resp, nil
        }
        lastErr = err
        
        // 指数退避：1s, 2s, 4s
        backoff := time.Duration(1<<uint(i)) * time.Second
        time.Sleep(backoff)
    }
    return nil, fmt.Errorf("failed after %d retries: %w", maxRetries, lastErr)
}
```

---

### 4. 文件上传处理

#### 4.1 存储结构

```
backend-go/uploads/
└── layout-images/
    └── 2026/
        └── 04/
            ├── 1712234567_abc123.png
            └── 1712234890_def456.jpg
```

#### 4.2 上传处理逻辑

```go
// handlers/upload.go
func UploadLayoutImage(c *gin.Context) {
    file, err := c.FormFile("image")
    if err != nil {
        utils.RespondError(c, 400, "INVALID_FILE", "No file uploaded")
        return
    }
    
    // 验证文件类型
    allowedTypes := []string{"image/png", "image/jpeg", "image/jpg"}
    contentType := file.Header.Get("Content-Type")
    if !contains(allowedTypes, contentType) {
        utils.RespondError(c, 400, "INVALID_FILE_TYPE", "Only PNG/JPG allowed")
        return
    }
    
    // 验证文件大小（5MB）
    if file.Size > 5*1024*1024 {
        utils.RespondError(c, 400, "FILE_TOO_LARGE", "Max 5MB")
        return
    }
    
    // 生成文件路径
    now := time.Now()
    dir := fmt.Sprintf("uploads/layout-images/%d/%02d", now.Year(), now.Month())
    os.MkdirAll(dir, 0755)
    
    filename := fmt.Sprintf("%d_%s%s", now.Unix(), utils.GenerateRandomString(6), filepath.Ext(file.Filename))
    filepath := filepath.Join(dir, filename)
    
    // 保存文件
    if err := c.SaveUploadedFile(file, filepath); err != nil {
        utils.RespondError(c, 500, "SAVE_FAILED", "Failed to save file")
        return
    }
    
    // 返回可访问的URL
    fileURL := fmt.Sprintf("/uploads/layout-images/%d/%02d/%s", now.Year(), now.Month(), filename)
    utils.RespondSuccess(c, 200, gin.H{"url": fileURL})
}
```

#### 4.3 静态文件服务

```go
// cmd/server/main.go
r.Static("/uploads", "./uploads")
```

---

### 5. Handler 实现

#### 5.1 创建布局模式

```go
// handlers/layout_patterns.go
func CreateLayoutPattern(c *gin.Context) {
    var req CreateLayoutPatternRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
        return
    }
    
    db := database.GetDB()
    llmService := services.GetLayoutService()
    
    var patternJson string
    var err error
    
    if req.Mode == "ai" {
        // AI生成模式
        if req.ImageURL == nil || req.UserPrompt == nil {
            utils.RespondError(c, 400, "MISSING_FIELDS", "imageUrl and userPrompt required for AI mode")
            return
        }
        
        patternJson, err = llmService.GenerateDSL(*req.ImageURL, *req.UserPrompt, req.Category)
        if err != nil {
            utils.RespondError(c, 500, "AI_GENERATION_FAILED", err.Error())
            return
        }
    } else {
        // 手动模式
        if req.PatternJson == nil {
            utils.RespondError(c, 400, "MISSING_FIELDS", "patternJson required for manual mode")
            return
        }
        patternJson = *req.PatternJson
    }
    
    // 创建记录
    pattern := models.LayoutPattern{
        ID:          utils.GenerateCUID(),
        Name:        req.Name,
        Description: req.Description,
        Category:    req.Category,
        ImageURL:    req.ImageURL,
        PatternJson: patternJson,
        CreatedBy:   req.Mode,
        Version:     1,
    }
    
    if err := db.Create(&pattern).Error; err != nil {
        utils.RespondError(c, 500, "CREATE_FAILED", "Failed to create pattern")
        return
    }
    
    utils.RespondSuccess(c, 201, pattern)
}
```

#### 5.2 校验和修正

```go
func ValidateLayoutPattern(c *gin.Context) {
    patternID := c.Param("id")
    
    var req ValidateLayoutPatternRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
        return
    }
    
    llmService := services.GetLayoutService()
    
    // LLM 校验
    result, err := llmService.ValidateDSL(req.PatternJson, req.UserFeedback)
    if err != nil {
        utils.RespondError(c, 500, "VALIDATION_FAILED", err.Error())
        return
    }
    
    // 如果用户提供了反馈，进行修正
    if req.UserFeedback != nil && *req.UserFeedback != "" {
        correctedDSL, err := llmService.CorrectDSL(req.PatternJson, *req.UserFeedback)
        if err == nil {
            result.CorrectedDSL = correctedDSL
        }
    }
    
    // 可选：更新数据库
    if result.Valid {
        db := database.GetDB()
        db.Model(&models.LayoutPattern{}).
            Where("id = ?", patternID).
            Updates(map[string]interface{}{
                "pattern_json": result.CorrectedDSL,
                "version":      gorm.Expr("version + 1"),
            })
    }
    
    utils.RespondSuccess(c, 200, result)
}
```

---

### 6. 关键文件清单

**新建文件**：
- `/backend-go/internal/services/llm/client.go` - LLM 客户端
- `/backend-go/internal/services/llm/config.go` - 配置管理
- `/backend-go/internal/services/llm/layout.go` - 布局服务
- `/backend-go/internal/services/llm/types.go` - 类型定义
- `/backend-go/internal/services/llm/prompts.go` - Prompt 模板
- `/backend-go/internal/handlers/layout_patterns.go` - 布局模式 Handler
- `/backend-go/internal/handlers/upload.go` - 文件上传 Handler
- `/backend-go/pkg/utils/random.go` - 随机字符串生成

**修改文件**：
- `/backend-go/internal/models/models.go` - 添加 Category 索引，新增字段
- `/backend-go/cmd/server/main.go` - 注册路由和静态文件服务

---

### 7. 实现步骤

**Phase 1: 基础设施（2天）**
1. 实现 LLM 客户端（client.go, config.go, types.go）
2. 实现文件上传功能（upload.go, 静态文件服务）
3. 添加工具函数（random.go）

**Phase 2: 核心功能（2-3天）**
1. 实现布局 DSL 生成服务（layout.go, prompts.go）
2. 实现布局模式 CRUD Handler（layout_patterns.go）
3. 实现校验和修正接口
4. 更新数据模型

**Phase 3: 测试和优化（1-2天）**
1. 单元测试（LLM 服务、Handler）
2. 集成测试（端到端流程）
3. Prompt 调优
4. 错误处理完善

---

### 8. 验证方案

**手动测试流程**：

1. **上传截图**：
   ```bash
   curl -X POST http://localhost:8080/api/v1/uploads/layout-image \
     -H "Authorization: Bearer <token>" \
     -F "image=@reference.png"
   ```

2. **AI 生成布局**：
   ```bash
   curl -X POST http://localhost:8080/api/v1/layout-patterns \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "mode": "ai",
       "name": "左图右列表",
       "category": "content",
       "imageUrl": "/uploads/layout-images/2026/04/xxx.png",
       "userPrompt": "左侧大图，右侧标题加5个要点"
     }'
   ```

3. **手动调整并校验**：
   ```bash
   curl -X POST http://localhost:8080/api/v1/layout-patterns/{id}/validate \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "patternJson": "{...修改后的DSL...}",
       "userFeedback": "把右侧标题字号改大一点"
     }'
   ```

4. **查询列表**：
   ```bash
   curl http://localhost:8080/api/v1/layout-patterns?category=content \
     -H "Authorization: Bearer <token>"
   ```

**预期结果**：
- 上传返回可访问的 URL
- AI 生成返回完整的 DSL JSON
- 校验返回修正后的 DSL 和问题列表
- 列表正确过滤和分页

---

### 9. 安全和性能考虑

**安全**：
- 文件上传：类型白名单、大小限制、路径遍历防护
- API 密钥：环境变量管理，不记录日志
- 输入验证：所有用户输入严格验证
- 认证：所有端点需要 JWT

**性能**：
- 并发控制：Semaphore 限制最大 3 个并发 LLM 请求
- 超时设置：60 秒超时
- 文件缓存：静态文件服务自动缓存
- 数据库索引：Category 字段添加索引

**监控**：
- 记录 LLM API 调用次数和延迟
- 记录失败率和重试次数
- 文件上传统计

---

## 总结

本方案实现了灵活的人机协作模板创建流程：
1. 用户上传截图 + 描述 → LLM 生成初始 DSL
2. 用户手动调整（直接编辑或自然语言）→ LLM 校验修正
3. 保存到数据库 → 供 Agent 查询使用

技术特点：
- 模块化设计，易于扩展
- 完善的容错机制
- 符合现有代码风格
- 支持 MVP 快速迭代

---

**文档版本**：v1.0  
**创建日期**：2026-04-04  
**维护者**：DeckGenie Team
