# 模板系统 API 测试指南

## 前置条件

1. 启动后端服务：
```bash
cd backend-go
go run cmd/server/main.go
```

2. 获取认证 Token：
```bash
# 注册用户
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# 登录获取 token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 保存返回的 token
export TOKEN="your_token_here"
```

## 测试流程

### 1. 上传参考截图

```bash
curl -X POST http://localhost:8080/api/v1/uploads/layout-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/your/reference.png"
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "url": "/uploads/layout-images/2026/04/1712234567_abc123.png",
    "filename": "1712234567_abc123.png",
    "size": 123456
  }
}
```

### 2. AI 生成布局模式

```bash
curl -X POST http://localhost:8080/api/v1/layout-patterns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "ai",
    "name": "左图右列表",
    "description": "适合产品介绍页面",
    "category": "content",
    "imageUrl": "/uploads/layout-images/2026/04/1712234567_abc123.png",
    "userPrompt": "左侧放一张大图，右侧是标题加5个要点列表"
  }'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "id": "c1712234567abc123",
    "name": "左图右列表",
    "description": "适合产品介绍页面",
    "category": "content",
    "imageUrl": "/uploads/layout-images/2026/04/1712234567_abc123.png",
    "patternJson": "{\"layoutId\":\"left-image-right-list\",\"name\":\"左图右列表\",...}",
    "createdBy": "ai",
    "version": 1,
    "createdAt": "2026-04-04T10:30:00Z",
    "updatedAt": "2026-04-04T10:30:00Z"
  }
}
```

### 3. 手动创建布局模式

```bash
curl -X POST http://localhost:8080/api/v1/layout-patterns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "manual",
    "name": "简单标题页",
    "category": "cover",
    "patternJson": "{\"layoutId\":\"simple-title\",\"name\":\"简单标题页\",\"category\":\"cover\",\"canvas\":{\"width\":1920,\"height\":1080},\"regions\":[{\"id\":\"title\",\"type\":\"text\",\"bounds\":{\"x\":100,\"y\":400,\"width\":1720,\"height\":280}}]}"
  }'
```

### 4. 查询布局模式列表

```bash
# 查询所有
curl http://localhost:8080/api/v1/layout-patterns \
  -H "Authorization: Bearer $TOKEN"

# 按分类过滤
curl "http://localhost:8080/api/v1/layout-patterns?category=content" \
  -H "Authorization: Bearer $TOKEN"

# 分页查询
curl "http://localhost:8080/api/v1/layout-patterns?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "c1712234567abc123",
      "name": "左图右列表",
      "category": "content",
      ...
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 5. 获取单个布局模式

```bash
curl http://localhost:8080/api/v1/layout-patterns/c1712234567abc123 \
  -H "Authorization: Bearer $TOKEN"
```

### 6. 校验和修正布局模式

```bash
curl -X POST http://localhost:8080/api/v1/layout-patterns/c1712234567abc123/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patternJson": "{\"layoutId\":\"left-image-right-list\",\"name\":\"左图右列表\",...}",
    "userFeedback": "把右侧标题的字号改大一点，从32改成40"
  }'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "valid": true,
    "correctedDsl": "{\"layoutId\":\"left-image-right-list\",...\"fontSize\":40...}",
    "issues": [],
    "suggestions": "布局结构合理，已根据反馈调整标题字号"
  }
}
```

### 7. 更新布局模式

```bash
curl -X PATCH http://localhost:8080/api/v1/layout-patterns/c1712234567abc123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "左图右列表（优化版）",
    "description": "优化后的布局"
  }'
```

### 8. 删除布局模式

```bash
curl -X DELETE http://localhost:8080/api/v1/layout-patterns/c1712234567abc123 \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "message": "Layout pattern deleted successfully"
  }
}
```

## 错误处理测试

### 1. 文件上传错误

```bash
# 上传非图片文件
curl -X POST http://localhost:8080/api/v1/uploads/layout-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/document.pdf"
```

**预期响应**：
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only PNG/JPG images are allowed"
  }
}
```

### 2. AI 生成失败（缺少必填字段）

```bash
curl -X POST http://localhost:8080/api/v1/layout-patterns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "ai",
    "name": "测试",
    "category": "content"
  }'
```

**预期响应**：
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "imageUrl and userPrompt are required for AI mode"
  }
}
```

### 3. 无效的分类

```bash
curl -X POST http://localhost:8080/api/v1/layout-patterns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "manual",
    "name": "测试",
    "category": "invalid_category",
    "patternJson": "{}"
  }'
```

**预期响应**：
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Key: 'CreateLayoutPatternRequest.Category' Error:Field validation for 'Category' failed on the 'oneof' tag"
  }
}
```

## 环境配置检查

确保 `.env` 文件包含以下配置：

```env
# LLM Configuration
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=gpt-3.5-turbo
VISION_LLM_MODEL=gpt-4-vision-preview
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3
```

## 数据库迁移

首次运行时，GORM 会自动创建/更新表结构。如果遇到问题，可以手动检查：

```bash
# 进入数据库
sqlite3 backend-go/data/ppt-agent.db

# 查看表结构
.schema layout_patterns

# 预期输出应包含新字段：category, created_by, version
```

## 性能测试

### 并发测试

```bash
# 使用 Apache Bench 测试并发上传
ab -n 10 -c 3 -H "Authorization: Bearer $TOKEN" \
  -p image.txt \
  http://localhost:8080/api/v1/uploads/layout-image
```

### LLM 调用测试

观察日志中的 LLM API 调用：
- 并发限制应该生效（最多 3 个并发）
- 失败时应该重试 3 次
- 超时应该在 60 秒

## 故障排查

### 1. LLM API 调用失败

检查：
- API 密钥是否正确
- 网络连接是否正常
- 模型名称是否正确

### 2. 文件上传失败

检查：
- `uploads/layout-images/` 目录是否有写权限
- 磁盘空间是否充足

### 3. 数据库错误

检查：
- `data/ppt-agent.db` 文件是否存在
- 数据库文件是否有读写权限
- 表结构是否正确迁移

## 下一步

完成测试后，可以继续实现：
1. 资源库管理（Asset 相关 API）
2. PPT 文件解析和元素提取
3. 前端集成和 UI 调试
