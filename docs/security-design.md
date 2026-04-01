# PPT 自动生成 Web 系统 - 安全设计方案

## 1. 概述

### 1.1 部署环境

系统部署于**企业内网**，仅内网用户可访问。安全策略以防御内部误操作和基本安全威胁为主。

### 1.2 安全设计原则

- 输入不可信：所有用户输入（文本、文件、URL）均需校验
- 最小权限：用户只能访问自己的项目和数据
- 防注入：SVG 内容、SQL 查询、HTML 渲染均需防注入
- 安全存储：密码哈希存储，敏感配置不落代码

---

## 2. 认证与授权

### 2.1 密码安全

| 项目 | 规则 |
|------|------|
| 哈希算法 | bcrypt，cost factor = 12 |
| 最小长度 | 8 位 |
| 复杂度 | 至少包含字母和数字 |
| 存储 | 仅存储 hash，禁止明文 |

### 2.2 JWT Token

| 项目 | 规则 |
|------|------|
| 算法 | HS256 |
| 有效期 | 7 天 |
| 签名密钥 | 环境变量 `JWT_SECRET`，至少 32 字符 |
| 载荷 | `{ userId, username, iat, exp }` |
| 传输 | Authorization Header 或 HttpOnly Cookie |

### 2.3 权限校验

所有涉及资源的接口必须校验资源归属：

```
中间件流程:
1. 解析 JWT → 获取 userId
2. 查询目标资源
3. 校验 resource.userId === jwt.userId
4. 不匹配 → 返回 403 FORBIDDEN
```

---

## 3. 输入校验

### 3.1 文本输入

| 校验项 | 规则 |
|--------|------|
| 最大长度 | 单次文本输入不超过 200,000 字符 |
| 编码 | 必须为有效 UTF-8 |
| 特殊字符 | 允许，但在渲染时转义 |

### 3.2 文件上传

| 文件类型 | 允许格式 | 大小上限 |
|----------|----------|----------|
| PDF | .pdf | 50 MB |
| 文本 | .txt, .md | 10 MB |
| 图片 | .png, .jpg, .jpeg, .webp | 20 MB |

**校验流程**：

```
1. 检查文件扩展名是否在白名单内
2. 检查 Content-Type 是否匹配
3. 检查文件大小是否超限
4. 读取文件头部 magic bytes 验证真实类型
5. PDF 文件：使用 pdfjs-dist 解析验证完整性
6. 图片文件：使用 sharp 验证图片有效性
7. 通过校验后写入 /uploads 目录
```

**文件名处理**：
- 丢弃原始文件名，使用 UUID 重命名
- 禁止路径穿越字符（`..`, `/`, `\`）

### 3.3 URL 输入

| 校验项 | 规则 |
|--------|------|
| 协议 | 仅允许 http / https |
| 域名 | 禁止 localhost、127.0.0.1、内网 IP 段（防 SSRF） |
| 抓取超时 | 10 秒 |
| 响应大小 | 最大 10 MB |
| 重定向 | 最多跟踪 3 次 |

**SSRF 防护**：

```
禁止访问的 IP 段：
- 127.0.0.0/8
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16
- 169.254.0.0/16
- ::1/128
- fc00::/7
```

### 3.4 项目名称与用户输入字段

| 字段 | 规则 |
|------|------|
| 项目名称 | 1~100 字符，不允许 HTML 标签 |
| 用户名 | 3~30 字符，字母数字下划线 |
| 昵称 | 1~50 字符，不允许 HTML 标签 |

---

## 4. SVG 安全

### 4.1 威胁分析

SVG 是 XML 格式，可嵌入：
- `<script>` 标签 → XSS 攻击
- `<foreignObject>` 中的 HTML → XSS 攻击
- 外部资源引用 → 信息泄露
- 超大 SVG → DoS 攻击

### 4.2 SVG Sanitize 规则

**模板 SVG 导入时**：

```
允许的元素白名单：
svg, g, rect, circle, ellipse, line, polyline, polygon,
path, text, tspan, textPath, defs, use, symbol,
linearGradient, radialGradient, stop, clipPath, mask,
pattern, filter, feGaussianBlur, feOffset, feMerge,
feMergeNode, feColorMatrix, feBlend, feFlood,
image, foreignObject, style, animate, animateTransform, set

禁止的元素：
script, iframe, object, embed, applet, form, input, button

允许的属性白名单：
id, class, x, y, cx, cy, r, rx, ry, width, height,
d, points, fill, stroke, stroke-width, stroke-dasharray,
opacity, transform, viewBox, preserveAspectRatio,
font-size, font-weight, font-family, text-anchor,
dominant-baseline, href (仅 xlink), style,
data-template-version, data-slot-*

禁止的属性：
on* (onclick, onload, onerror 等所有事件属性)
```

**LLM 生成的 SVG 内容**：

```
1. 使用 DOMPurify 进行 sanitize
2. 移除所有 <script> 标签
3. 移除所有 on* 事件属性
4. 外部 URL 引用替换为本地代理路径
5. 限制 SVG 总大小不超过 500KB
```

### 4.3 foreignObject 安全

`<foreignObject>` 用于文本渲染，需额外处理：

```
1. 内部 HTML 内容使用 DOMPurify sanitize
2. 仅允许 div, span, p, br, strong, em 元素
3. 仅允许 style 属性（且 style 值需校验）
4. 禁止嵌套 script、iframe、form
```

---

## 5. 第三方图片安全

### 5.1 图片代理策略

系统不直接在前端引用第三方图片 URL，而是通过后端代理：

```
流程：
1. ImageSearchAgent 返回候选图片 URL
2. 后端下载图片到本地 /uploads/cache/ 目录
3. 校验图片有效性（格式、大小、像素尺寸）
4. 前端通过本地路径 /api/v1/image-proxy/:hash 访问
```

### 5.2 图片校验

| 校验项 | 规则 |
|--------|------|
| 格式 | 仅允许 PNG, JPEG, WebP, GIF |
| 大小 | 单张不超过 10 MB |
| 像素 | 单边不超过 8000px |
| 下载超时 | 15 秒 |

### 5.3 缓存清理

- 缓存图片 24 小时后自动清理
- 被引用的图片（已嵌入 Slide）永久保留
- 缓存目录总大小上限 1 GB，超出时 LRU 淘汰

---

## 6. 数据安全

### 6.1 SQL 注入防护

- 使用 Prisma ORM，所有查询通过参数化执行
- 禁止拼接原始 SQL 字符串
- 禁止将用户输入直接传入 `$queryRaw`

### 6.2 敏感配置管理

以下配置必须通过环境变量注入，禁止写入代码：

```env
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-at-least-32-chars
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.example.com/v1
IMAGE_SEARCH_API_KEY=xxx
```

### 6.3 日志脱敏

- 日志中禁止输出密码、Token、API Key
- 用户输入内容在日志中截断为前 200 字符
- Agent payload 日志中不包含完整 LLM 响应

---

## 7. 前端安全

### 7.1 XSS 防护

- React 默认转义所有动态内容
- SVG 渲染使用 `dangerouslySetInnerHTML` 时，必须先经过 DOMPurify sanitize
- 聊天消息展示不解析 HTML，仅渲染纯文本和 Markdown

### 7.2 CSRF 防护

- JWT 通过 Authorization Header 传输时天然防 CSRF
- 若使用 Cookie 方案，需添加 SameSite=Strict 属性

---

## 8. 安全检查清单

| 检查项 | 负责模块 | 优先级 |
|--------|----------|--------|
| 密码 bcrypt 哈希 | 认证模块 | P0 |
| JWT 签名校验 | 中间件 | P0 |
| 资源归属校验 | 中间件 | P0 |
| 文件上传类型校验 | 内容处理 | P0 |
| SVG sanitize | 模板/渲染 | P0 |
| URL SSRF 防护 | 内容提取 | P0 |
| SQL 参数化查询 | 全局 | P0 |
| 环境变量管理 | 部署 | P0 |
| 图片代理 | 图片模块 | P1 |
| 日志脱敏 | 全局 | P1 |
| foreignObject sanitize | SVG 渲染 | P1 |
