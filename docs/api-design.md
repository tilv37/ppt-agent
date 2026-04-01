# PPT 自动生成 Web 系统 - 详细接口设计文档

## 1. 概述

### 1.1 技术规范

- **认证**: JWT Token（HttpOnly Cookie 或 Authorization Header）
- **分页**: Cursor-based
- **流式推送**: SSE (Server-Sent Events)
- **错误格式**: 统一 `{ code, message, details }`

### 1.2 Base URL

```
/api/v1
```

### 1.3 通用请求头

```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### 1.4 通用响应格式

**成功**:
```json
{
  "success": true,
  "data": { ... }
}
```

**分页列表**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "nextCursor": "xxx",
    "hasMore": true
  }
}
```

**错误**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": { ... }
  }
}
```

---

## 2. 错误码定义

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| UNAUTHORIZED | 401 | 未登录或 Token 过期 |
| FORBIDDEN | 403 | 无权限访问 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| PIPELINE_ERROR | 500 | Agent 管线执行错误 |
| RATE_LIMITED | 429 | 请求过于频繁 |

---

## 3. 接口列表

### 3.1 认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 注册 |
| POST | /auth/login | 登录 |
| POST | /auth/logout | 登出 |
| GET | /auth/me | 获取当前用户信息 |

### 3.2 项目模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /projects | 创建项目 |
| GET | /projects | 列表查询 |
| GET | /projects/:id | 获取项目详情 |
| PATCH | /projects/:id | 更新项目 |
| DELETE | /projects/:id | 删除项目 |

### 3.3 内容处理模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /extract | 提取文本内容 |
| POST | /pipeline/start | 启动生成管线 |
| POST | /pipeline/confirm-outline | 确认大纲继续生成 |
| GET | /pipeline/stream/:projectId | SSE 流式进度 |

### 3.4 演示文稿与幻灯片模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /projects/:id/presentation | 获取演示文稿 |
| GET | /presentations/:id/slides | 列表查询幻灯片 |
| GET | /slides/:id | 获取幻灯片详情 |
| PATCH | /slides/:id | 更新幻灯片 |

### 3.5 聊天编辑模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /projects/:id/chat | 聊天历史 |
| POST | /projects/:id/chat | 发送消息 |

### 3.6 模板模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /templates | 模板列表 |
| POST | /templates/from-screenshot | 从截图解析模板 |
| GET | /templates/:id | 模板详情 |
| DELETE | /templates/:id | 删除模板 |

### 3.7 图片与绘图模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /image-search | 搜索图片 |
| POST | /image-score | 图片评分 |
| POST | /draw | 生成 SVG 图形 |

### 3.8 导出模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /projects/:id/export | 导出 PPT |

---

## 4. 接口详细设计

### 4.1 认证模块

#### POST /auth/register

**请求**:
```json
{
  "username": "john",
  "nickname": "John Doe",
  "password": "securePassword123"
}
```

**响应** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "john",
      "nickname": "John Doe",
      "createdAt": "2026-04-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**错误码**: VALIDATION_ERROR (用户名已存在)

---

#### POST /auth/login

**请求**:
```json
{
  "username": "john",
  "password": "securePassword123",
  "deviceFingerprint": "browser_fingerprint_xxx"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "john",
      "nickname": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**错误码**: UNAUTHORIZED (用户名或密码错误)

---

#### POST /auth/logout

**请求**: 无 Body

**响应** (200):
```json
{
  "success": true,
  "data": { "message": "已登出" }
}
```

---

#### GET /auth/me

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john",
    "nickname": "John Doe",
    "createdAt": "2026-04-01T00:00:00Z",
    "lastLoginAt": "2026-04-01T12:00:00Z"
  }
}
```

---

### 4.2 项目模块

#### POST /projects

**请求**:
```json
{
  "name": "Q1 汇报材料"
}
```

**响应** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Q1 汇报材料",
    "status": "draft",
    "createdAt": "2026-04-01T00:00:00Z",
    "updatedAt": "2026-04-01T00:00:00Z"
  }
}
```

---

#### GET /projects

**Query 参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| cursor | string | 分页游标 |
| limit | number | 每页数量（默认 20） |
| status | string | 按状态筛选 |

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Q1 汇报材料",
      "status": "ready",
      "coverSlideId": "slide_uuid",
      "createdAt": "2026-04-01T00:00:00Z",
      "updatedAt": "2026-04-01T12:00:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "encoded_cursor",
    "hasMore": false
  }
}
```

---

#### GET /projects/:id

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Q1 汇报材料",
    "status": "ready",
    "coverSlideId": "slide_uuid",
    "presentation": {
      "id": "uuid",
      "title": "Q1 工作汇报",
      "theme": "default",
      "aspectRatio": "16:9",
      "targetSlideCount": 10,
      "actualSlideCount": 10
    },
    "createdAt": "2026-04-01T00:00:00Z",
    "updatedAt": "2026-04-01T12:00:00Z"
  }
}
```

---

#### PATCH /projects/:id

**请求**:
```json
{
  "name": "Q1 汇报材料（新）"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Q1 汇报材料（新）",
    "status": "ready",
    "updatedAt": "2026-04-01T12:30:00Z"
  }
}
```

---

#### DELETE /projects/:id

**响应** (200):
```json
{
  "success": true,
  "data": { "message": "项目已删除" }
}
```

---

### 4.3 内容处理模块

#### POST /extract

**请求**:
```json
{
  "type": "text | pdf | url",
  "content": "文本内容或文件URL或URL链接",
  "options": {
    "maxLength": 50000
  }
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "text": "提取后的文本内容...",
    "sourceType": "text",
    "wordCount": 1234,
    "summary": "内容摘要..."
  }
}
```

---

#### POST /pipeline/start

**请求**:
```json
{
  "projectId": "uuid",
  "content": "用户输入的原始内容",
  "targetSlideCount": 10,
  "theme": "default",
  "requirements": "面向投资人的汇报材料，语气正式",
  "sourceType": "text"
}
```

**响应** (202):
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "status": "generating"
  }
}
```

---

#### POST /pipeline/confirm-outline

**请求**:
```json
{
  "projectId": "uuid",
  "outline": {
    "title": "Q1 工作汇报",
    "slides": [
      { "index": 0, "title": "封面", "templateType": "cover" },
      { "index": 1, "title": "目录", "templateType": "toc" },
      { "index": 2, "title": "业务概览", "templateType": "text", "keyPoints": ["..."] }
    ]
  }
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "status": "generating"
  }
}
```

---

#### GET /pipeline/stream/:projectId

**SSE 事件格式**:

```
event: phase
data: {"phase":"extraction","status":"completed","summary":"内容提取完成"}

event: phase
data: {"phase":"planning","status":"in_progress","agent":"OutlinePlannerAgent","step":"analyzing"}

event: phase
data: {"phase":"planning","status":"completed","summary":"大纲生成完成","outline":{...}}

event: confirm_required
data: {"message":"请确认大纲","outline":{...}}

event: phase
data: {"phase":"writing","status":"in_progress","agent":"ContentWriterAgent","slideIndex":0}

event: phase
data: {"phase":"writing","status":"completed","slideIndex":0,"slideId":"uuid"}

event: phase
data: {"phase":"visual","status":"in_progress","slideIndex":0,"visualType":"chart"}

event: done
data: {"status":"ready","presentationId":"uuid"}
```

---

### 4.4 演示文稿与幻灯片模块

#### GET /presentations/:id/slides

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "index": 0,
      "title": "封面",
      "templateId": "template_uuid",
      "visualType": "none",
      "previewImage": "/uploads/slides/xxx/0.png",
      "status": "rendered"
    }
  ]
}
```

---

#### GET /slides/:id

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "presentationId": "uuid",
    "index": 0,
    "templateId": "template_uuid",
    "title": "业务概览",
    "subtitle": "2026年第一季度",
    "contentJson": "{\"bullets\":[\"...\"]}",
    "visualType": "chart",
    "generatedSvg": "<svg>...</svg>",
    "previewImage": "/uploads/slides/xxx/0.png",
    "status": "rendered"
  }
}
```

---

#### PATCH /slides/:id

**请求**:
```json
{
  "title": "新标题",
  "contentJson": "{\"bullets\":[\"新内容\"]}"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "新标题",
    "status": "revising"
  }
}
```

---

### 4.5 聊天编辑模块

#### GET /projects/:id/chat

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "role": "user",
      "content": "把第3页标题改成更正式一些",
      "intent": "EDIT",
      "targetSlideIndex": 2,
      "createdAt": "2026-04-01T12:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "已将第3页标题修改为「2026年Q1业务深度分析」",
      "intent": "SYSTEM",
      "createdAt": "2026-04-01T12:00:01Z"
    }
  ]
}
```

---

#### POST /projects/:id/chat

**请求**:
```json
{
  "content": "把第3页标题改成更正式一些",
  "targetSlideIndex": 2
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "role": "user",
      "content": "把第3页标题改成更正式一些",
      "intent": "EDIT",
      "targetSlideIndex": 2,
      "createdAt": "2026-04-01T12:00:00Z"
    }
  }
}
```

**后续通过 SSE 推送处理结果（复用 /pipeline/stream/:projectId 事件格式）**

---

### 4.6 模板模块

#### GET /templates

**Query 参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| category | string | 按分类筛选 |
| cursor | string | 分页游标 |
| limit | number | 每页数量（默认 20） |
| isBuiltIn | boolean | 是否系统内置 |

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "简约商务封面",
      "category": "cover",
      "tags": ["商务", "简约"],
      "thumbnail": "/uploads/templates/xxx.png",
      "isBuiltIn": true
    }
  ],
  "pagination": {
    "nextCursor": "xxx",
    "hasMore": false
  }
}
```

---

#### POST /templates/from-screenshot

**请求**: `multipart/form-data`
- file: 图片文件

**响应** (200):
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "uuid",
      "name": "解析模板",
      "category": "text",
      "svgContent": "<svg>...</svg>",
      "schemaJson": "{\"slots\":[...]}"
    }
  }
}
```

---

#### GET /templates/:id

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "简约商务封面",
    "category": "cover",
    "tags": ["商务", "简约"],
    "svgContent": "<svg>...</svg>",
    "schemaJson": "{\"slots\":[...]}",
    "thumbnail": "/uploads/templates/xxx.png",
    "isBuiltIn": true
  }
}
```

---

#### DELETE /templates/:id

**响应** (200):
```json
{
  "success": true,
  "data": { "message": "模板已删除" }
}
```

**错误码**: FORBIDDEN (不允许删除内置模板)

---

### 4.7 图片与绘图模块

#### POST /image-search

**请求**:
```json
{
  "query": "商务会议 讨论",
  "count": 5
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://example.com/image1.jpg",
        "title": "商务会议场景",
        "thumbnailUrl": "https://example.com/thumb1.jpg"
      }
    ]
  }
}
```

---

#### POST /image-score

**请求**:
```json
{
  "imageUrl": "https://example.com/image1.jpg",
  "context": {
    "slideTitle": "业务概览",
    "keyPoints": ["Q1营收增长20%", "市场份额提升"]
  }
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "score": 0.85,
    "reason": "图片包含商务场景且色彩与主题契合"
  }
}
```

---

#### POST /draw

**请求**:
```json
{
  "type": "bar_chart | pie_chart | line_chart | flowchart | diagram",
  "data": {
    "title": "Q1 营收对比",
    "categories": ["产品A", "产品B", "产品C"],
    "values": [120, 85, 150]
  },
  "constraints": {
    "width": 400,
    "height": 300,
    "style": "business"
  }
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "svg": "<svg>...</svg>",
    "width": 400,
    "height": 300
  }
}
```

---

### 4.8 导出模块

#### POST /projects/:id/export

**请求**:
```json
{
  "format": "pptx"
}
```

**响应** (202):
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "status": "exporting",
    "estimatedTime": 5
  }
}
```

**导出完成后的 SSE 事件**:
```
event: done
data: {"status":"ready","downloadUrl":"/uploads/exports/xxx/report.pptx"}
```

---

## 5. 附录：Agent 进度事件类型

| 事件类型 | 说明 |
|---------|------|
| phase | 阶段切换 |
| confirm_required | 需要用户确认（大纲） |
| agent_start | Agent 开始执行 |
| agent_step | Agent 步骤更新 |
| agent_done | Agent 完成 |
| slide_update | 幻灯片更新 |
| done | 管线完成 |
| error | 管线错误 |

---

## 6. 附录：Phase 阶段枚举

| Phase | 说明 |
|-------|------|
| extraction | 内容提取 |
| planning | 大纲规划 |
| writing | 内容撰写 |
| layout | 布局选择 |
| visual | 视觉处理 |
| review | 质量审查 |
| exporting | 导出中 |
