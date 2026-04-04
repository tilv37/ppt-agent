# 配置管理和图片处理优化说明

## 更新内容

### 1. 全局配置管理重构

**问题**：原来的 `llm/config.go` 只能处理 LLM 相关配置，不够通用。

**解决方案**：创建全局配置管理系统 `internal/config/config.go`

#### 新增配置结构

```go
type Config struct {
    Server   ServerConfig      // 服务器配置
    Database DatabaseConfig    // 数据库配置
    JWT      JWTConfig         // JWT 配置
    LLM      LLMConfig         // LLM 配置
    Upload   UploadConfig      // 文件上传配置
    CORS     CORSConfig        // CORS 配置
}
```

#### 支持的配置项

**服务器配置**：
- `PORT` - 服务器端口（默认：8080）

**数据库配置**：
- `DATABASE_URL` - 数据库路径（默认：./data/ppt-agent.db）

**JWT 配置**：
- `JWT_SECRET` - JWT 密钥
- `JWT_EXPIRES_IN` - 过期时间（默认：168h）

**LLM 配置**：
- `LLM_BASE_URL` - API 基础 URL
- `LLM_API_KEY` - API 密钥
- `LLM_MODEL` - 文本模型（默认：gpt-3.5-turbo）
- `VISION_LLM_MODEL` - 视觉模型（默认：gpt-4-vision-preview）
- `LLM_TIMEOUT` - 超时时间（默认：60000ms）
- `LLM_MAX_CONCURRENCY` - 最大并发数（默认：3）

**上传配置**：
- `UPLOAD_MAX_FILE_SIZE` - 最大文件大小（默认：5MB）
- `UPLOAD_DIR` - 上传目录（默认：uploads）

**CORS 配置**：
- 允许的源（默认：localhost:5173, localhost:3000）

#### 使用方式

```go
// 加载配置
cfg := config.Load()

// 访问配置
port := cfg.Server.Port
apiKey := cfg.LLM.APIKey
maxSize := cfg.Upload.MaxFileSize
```

### 2. Base64 图片处理

**问题**：原来使用 URL 传递图片给 LLM，本地调试时 LLM 无法访问本地文件。

**解决方案**：自动将本地文件转换为 Base64 Data URL

#### 新增工具函数 `pkg/utils/image.go`

```go
// ImageToBase64 - 将图片文件转换为 base64 data URL
func ImageToBase64(filePath string) (string, error)

// IsBase64DataURL - 检查是否为 base64 data URL
func IsBase64DataURL(url string) bool

// IsLocalFilePath - 检查是否为本地文件路径
func IsLocalFilePath(url string) bool

// ConvertImageURLToBase64 - 智能转换图片 URL
// - 本地路径 → base64 data URL
// - base64 data URL → 原样返回
// - 远程 URL → 原样返回
func ConvertImageURLToBase64(imageURL string) (string, error)
```

#### 工作流程

1. **用户上传图片** → 保存到本地文件系统
2. **返回本地 URL** → `/uploads/layout-images/2026/04/xxx.png`
3. **调用 LLM 时** → 自动转换为 base64 data URL
4. **LLM 接收** → `data:image/png;base64,iVBORw0KG...`

#### 支持的图片格式

- PNG (image/png)
- JPEG/JPG (image/jpeg)
- GIF (image/gif)
- WebP (image/webp)

#### 示例

```go
// 本地文件路径
imageURL := "/uploads/layout-images/2026/04/1712234567_abc123.png"

// 自动转换为 base64
base64URL, err := utils.ConvertImageURLToBase64(imageURL)
// 结果: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."

// 远程 URL 保持不变
remoteURL := "https://example.com/image.png"
result, _ := utils.ConvertImageURLToBase64(remoteURL)
// 结果: "https://example.com/image.png"

// base64 data URL 保持不变
dataURL := "data:image/png;base64,iVBORw0KG..."
result, _ := utils.ConvertImageURLToBase64(dataURL)
// 结果: "data:image/png;base64,iVBORw0KG..."
```

### 3. 更新的文件

#### 新增文件

1. **internal/config/config.go** - 全局配置管理
2. **pkg/utils/image.go** - 图片处理工具

#### 修改文件

1. **internal/services/llm/config.go** - 简化为调用全局配置
2. **internal/services/llm/client.go** - 使用 `config.LLMConfig`
3. **internal/services/llm/layout.go** - 添加 base64 转换
4. **internal/handlers/upload.go** - 使用全局配置
5. **cmd/server/main.go** - 使用全局配置，初始化 LLM 服务

### 4. 优势

#### 配置管理优势

✅ **统一管理**：所有配置集中在一个地方
✅ **类型安全**：强类型配置结构
✅ **易于扩展**：添加新配置项很简单
✅ **默认值**：所有配置都有合理的默认值
✅ **单例模式**：全局唯一配置实例

#### Base64 图片优势

✅ **本地调试友好**：LLM 可以直接访问本地图片
✅ **无需额外服务**：不需要启动图片服务器
✅ **自动处理**：开发者无需关心转换细节
✅ **兼容性好**：支持本地、远程、base64 三种格式
✅ **安全性**：图片数据直接传输，无需暴露文件路径

### 5. 使用示例

#### 环境变量配置 (.env)

```env
# Server
PORT=8080

# Database
DATABASE_URL=./data/ppt-agent.db

# JWT
JWT_SECRET=your-secret-key-change-in-production-32chars-minimum
JWT_EXPIRES_IN=168h

# LLM
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=gpt-3.5-turbo
VISION_LLM_MODEL=gpt-4-vision-preview
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3

# Upload
UPLOAD_MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# CORS (可选，使用默认值)
```

#### API 调用示例

```bash
# 1. 上传图片
curl -X POST http://localhost:8080/api/v1/uploads/layout-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@reference.png"

# 返回：
# {
#   "success": true,
#   "data": {
#     "url": "/uploads/layout-images/2026/04/1712234567_abc123.png"
#   }
# }

# 2. AI 生成布局（自动转换为 base64）
curl -X POST http://localhost:8080/api/v1/layout-patterns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "ai",
    "name": "左图右列表",
    "category": "content",
    "imageUrl": "/uploads/layout-images/2026/04/1712234567_abc123.png",
    "userPrompt": "左侧大图，右侧标题加列表"
  }'

# 后端自动将 imageUrl 转换为 base64 后发送给 LLM
```

### 6. 迁移指南

如果你有现有代码使用旧的配置方式，需要进行以下更新：

#### 旧代码

```go
// 旧方式
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}
```

#### 新代码

```go
// 新方式
cfg := config.Get()
port := cfg.Server.Port
```

### 7. 测试建议

#### 测试配置加载

```bash
# 设置环境变量
export PORT=9000
export LLM_API_KEY=sk-test-key

# 启动服务
go run cmd/server/main.go

# 验证配置生效
# 服务应该在 9000 端口启动
```

#### 测试 Base64 转换

```bash
# 1. 上传本地图片
curl -X POST http://localhost:8080/api/v1/uploads/layout-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test.png"

# 2. 使用返回的 URL 生成布局
# 后端会自动转换为 base64

# 3. 检查 LLM 调用日志
# 应该看到 base64 data URL 而不是文件路径
```

### 8. 故障排查

#### 配置未生效

**问题**：修改了 .env 文件但配置未生效

**解决**：
1. 确保 .env 文件在正确的位置
2. 重启服务器
3. 检查环境变量是否正确设置：`echo $PORT`

#### Base64 转换失败

**问题**：图片转换失败

**解决**：
1. 检查文件路径是否正确
2. 确认文件格式是否支持（PNG/JPG/GIF/WebP）
3. 检查文件是否存在且可读
4. 查看错误日志获取详细信息

#### 文件大小限制

**问题**：上传大图片失败

**解决**：
1. 调整 `UPLOAD_MAX_FILE_SIZE` 环境变量
2. 注意：base64 编码会增加约 33% 的大小
3. 建议：压缩图片后再上传

### 9. 性能考虑

#### Base64 编码开销

- **编码时间**：1MB 图片约 10-20ms
- **大小增加**：约 33%（base64 编码特性）
- **内存占用**：临时增加约 2 倍文件大小

#### 优化建议

1. **图片压缩**：上传前压缩图片
2. **尺寸限制**：限制图片尺寸（如 1920x1080）
3. **格式选择**：优先使用 JPEG（文件更小）
4. **缓存策略**：考虑缓存 base64 结果（未来优化）

### 10. 未来扩展

可以继续添加的配置项：

```go
type Config struct {
    // ... 现有配置 ...
    
    Redis    RedisConfig      // Redis 缓存配置
    Email    EmailConfig      // 邮件服务配置
    Storage  StorageConfig    // 对象存储配置（S3/OSS）
    Logging  LoggingConfig    // 日志配置
    Metrics  MetricsConfig    // 监控指标配置
}
```

## 总结

通过这次优化：

1. ✅ **配置管理更加统一和规范**
2. ✅ **本地调试体验大幅提升**
3. ✅ **代码结构更加清晰**
4. ✅ **易于维护和扩展**
5. ✅ **向后兼容，无需修改 API**

所有改动都是向后兼容的，现有的 API 调用方式保持不变，只是内部实现更加优雅和高效。
