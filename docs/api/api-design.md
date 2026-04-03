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

（文档继续，已移入此文件）