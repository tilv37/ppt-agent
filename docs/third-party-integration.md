# PPT 自动生成 Web 系统 - 第三方服务集成规格

## 1. 概述

### 1.1 外部依赖清单

| 服务 | 用途 | 库/API | 必须/可选 |
|------|------|--------|-----------|
| LLM Provider | 所有 Agent 推理 | OpenAI-compatible API | 必须 |
| Unsplash | 图片搜索 | Unsplash API v1 | 可选（降级为纯文本） |
| PDF 解析 | 内容提取 | pdf-parse (pdfjs-dist) | 必须 |
| 网页抓取 | URL 内容提取 | cheerio + axios | 必须 |
| SVG → PNG | 缩略图生成 | sharp + resvg-js | 必须 |
| PPTX 生成 | 导出 | pptxgenjs | 必须 |

### 1.2 统一配置结构

所有第三方服务的配置通过环境变量注入：

```env
# LLM
LLM_BASE_URL=https://api.example.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat

# Unsplash
UNSPLASH_ACCESS_KEY=xxx

# 可选覆盖
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3
IMAGE_SEARCH_ENABLED=true
```

---

## 2. LLM Provider 集成

### 2.1 接口规范

使用 OpenAI-compatible Chat Completions API，通过 `openai` SDK 接入：

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});
```

### 2.2 模型配置

运行时从 `LLM_MODEL` 环境变量解析默认模型，各 Agent 可覆盖：

```typescript
interface LLMConfig {
  model: string;        // 默认 process.env.LLM_MODEL
  temperature: number;
  maxTokens: number;
  topP?: number;
  responseFormat?: { type: "json_object" };
  timeout: number;      // 默认 60000ms
}
```

### 2.3 调用封装

```typescript
interface LLMCallOptions {
  agentName: string;
  systemPrompt: string;
  userPrompt: string;
  config: LLMConfig;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

async function callLLM(options: LLMCallOptions): Promise<string> {
  const { agentName, systemPrompt, userPrompt, config, stream, onChunk } = options;

  const startTime = Date.now();

  try {
    if (stream && onChunk) {
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        response_format: config.responseFormat,
        stream: true,
      });

      let fullContent = "";
      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        fullContent += delta;
        onChunk(delta);
      }
      return fullContent;
    } else {
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        response_format: config.responseFormat,
      });

      return response.choices[0]?.message?.content ?? "";
    }
  } finally {
    const duration = Date.now() - startTime;
    // 记录 AgentTrace
  }
}
```

### 2.4 错误处理

| HTTP 状态码 | 错误类型 | 处理方式 |
|-------------|----------|----------|
| 401 | API Key 无效 | 立即终止，通知用户检查配置 |
| 429 | 限流 | 指数退避重试，降低并发至 1 |
| 500/502/503 | 服务端错误 | 指数退避重试，最多 3 次 |
| 超时 | 网络/响应超时 | 重试，最多 3 次 |

**指数退避策略**：

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 秒
  maxDelay: 30000,      // 30 秒
  backoffMultiplier: 2,
};

function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelay);
}
```

### 2.5 并发控制

```typescript
import PQueue from "p-queue";

const llmQueue = new PQueue({
  concurrency: parseInt(process.env.LLM_MAX_CONCURRENCY ?? "3"),
});

// 使用队列包装 LLM 调用
async function queuedLLMCall(options: LLMCallOptions): Promise<string> {
  return llmQueue.add(() => callLLM(options));
}
```

### 2.6 Mock 模式

开发和测试环境可启用 Mock 模式，跳过实际 LLM 调用：

```env
LLM_MOCK_ENABLED=true
LLM_MOCK_DELAY=500
```

```typescript
if (process.env.LLM_MOCK_ENABLED === "true") {
  // 返回预定义的 mock 数据（按 agentName 匹配）
  // 模拟延迟 LLM_MOCK_DELAY ms
}
```

Mock 数据文件位置：`lib/agents/__mocks__/{agentName}.json`

---

## 3. Unsplash 图片搜索集成

### 3.1 API 概述

| 项目 | 说明 |
|------|------|
| 端点 | `https://api.unsplash.com/search/photos` |
| 认证 | Header `Authorization: Client-ID {ACCESS_KEY}` |
| 免费额度 | 50 次/小时（Demo），5000 次/小时（Production） |
| 返回格式 | JSON |

### 3.2 接口封装

```typescript
interface UnsplashSearchOptions {
  query: string;
  perPage?: number;       // 默认 5
  orientation?: "landscape" | "portrait" | "squarish";
  color?: string;
}

interface UnsplashImage {
  id: string;
  url: string;            // regular 尺寸 URL
  thumbnailUrl: string;   // small 尺寸 URL
  width: number;
  height: number;
  description: string | null;
  photographer: string;
  downloadUrl: string;    // 触发下载统计的 URL
}

async function searchImages(options: UnsplashSearchOptions): Promise<UnsplashImage[]> {
  const response = await axios.get("https://api.unsplash.com/search/photos", {
    headers: {
      Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
    },
    params: {
      query: options.query,
      per_page: options.perPage ?? 5,
      orientation: options.orientation ?? "landscape",
      color: options.color,
    },
    timeout: 10000,
  });

  return response.data.results.map((item: any) => ({
    id: item.id,
    url: item.urls.regular,
    thumbnailUrl: item.urls.small,
    width: item.width,
    height: item.height,
    description: item.description || item.alt_description,
    photographer: item.user.name,
    downloadUrl: item.links.download_location,
  }));
}
```

### 3.3 图片下载与代理

搜索到图片后，需下载到本地代理服务：

```typescript
async function downloadAndCacheImage(imageUrl: string): Promise<string> {
  const hash = crypto.createHash("md5").update(imageUrl).digest("hex");
  const cachePath = path.join(UPLOADS_DIR, "cache", `${hash}.jpg`);

  // 检查缓存
  if (await fileExists(cachePath)) {
    return `/api/v1/image-proxy/${hash}`;
  }

  // 下载
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 15000,
    maxContentLength: 10 * 1024 * 1024, // 10MB
  });

  // 使用 sharp 验证并处理
  const image = sharp(response.data);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image data");
  }

  // 限制最大尺寸
  if (metadata.width > 3840 || metadata.height > 2160) {
    await image.resize(3840, 2160, { fit: "inside" }).toFile(cachePath);
  } else {
    await fs.writeFile(cachePath, response.data);
  }

  return `/api/v1/image-proxy/${hash}`;
}
```

### 3.4 下载统计（Unsplash 要求）

Unsplash API 条款要求在实际使用图片时触发下载端点：

```typescript
async function triggerDownload(downloadUrl: string): Promise<void> {
  try {
    await axios.get(downloadUrl, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
      timeout: 5000,
    });
  } catch {
    // 下载统计失败不影响主流程，仅记录日志
  }
}
```

### 3.5 额度管理

```typescript
class RateLimiter {
  private remaining: number = 50;
  private resetTime: number = 0;

  updateFromHeaders(headers: Record<string, string>): void {
    this.remaining = parseInt(headers["x-ratelimit-remaining"] ?? "50");
    this.resetTime = parseInt(headers["x-ratelimit-reset"] ?? "0") * 1000;
  }

  canRequest(): boolean {
    if (this.remaining > 5) return true;  // 保留 5 次余量
    return Date.now() > this.resetTime;
  }

  waitTime(): number {
    if (this.canRequest()) return 0;
    return Math.max(0, this.resetTime - Date.now());
  }
}
```

### 3.6 降级策略

| 情况 | 降级方式 |
|------|----------|
| `UNSPLASH_ACCESS_KEY` 未配置 | 跳过图片搜索，所有页面标记 `needsVisual=false` |
| 额度耗尽 | 等待重置或跳过，当前请求降级为纯文本 |
| 搜索无结果 | 尝试简化关键词重搜一次，仍无结果则跳过 |
| 下载失败 | 尝试下一候选图片，全部失败则跳过 |

---

## 4. PDF 解析集成

### 4.1 库选择

使用 `pdf-parse`（基于 `pdfjs-dist`），纯 JavaScript 实现，无系统依赖。

```
npm install pdf-parse
```

### 4.2 接口封装

```typescript
import pdfParse from "pdf-parse";

interface ParsedPDF {
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

async function parsePDF(filePath: string): Promise<ParsedPDF> {
  const buffer = await fs.readFile(filePath);

  // 文件大小检查
  if (buffer.length > 50 * 1024 * 1024) {
    throw new Error("PDF file exceeds 50MB limit");
  }

  const data = await pdfParse(buffer, {
    max: 100,  // 最多解析 100 页
  });

  return {
    text: data.text,
    pageCount: data.numpages,
    metadata: {
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate,
    },
  };
}
```

### 4.3 文本后处理

PDF 提取的文本通常需要清洗：

```typescript
function cleanPDFText(rawText: string): string {
  return rawText
    // 合并被分割的单词（行末连字符）
    .replace(/-\n/g, "")
    // 合并非段落的换行
    .replace(/(?<!\n)\n(?!\n)/g, " ")
    // 移除多余空白
    .replace(/ {2,}/g, " ")
    // 移除页码行（常见模式）
    .replace(/^\s*\d+\s*$/gm, "")
    .trim();
}
```

### 4.4 错误处理

| 错误 | 处理 |
|------|------|
| 加密 PDF | 抛出错误，通知用户"PDF 文件已加密，无法解析" |
| 扫描件 PDF（无文本层） | 检测 `text.length < 50`，提示用户"PDF 可能为扫描件，文字内容极少" |
| 损坏文件 | 捕获解析异常，提示用户"PDF 文件可能已损坏" |
| 超大文件 | 前置大小检查，超过 50MB 拒绝 |

---

## 5. 网页抓取集成

### 5.1 库选择

使用 `axios` + `cheerio` 进行 HTTP 抓取和 DOM 解析，轻量无依赖。

```
npm install axios cheerio
```

### 5.2 接口封装

```typescript
import axios from "axios";
import * as cheerio from "cheerio";

interface FetchedWebContent {
  title: string;
  text: string;
  url: string;
  wordCount: number;
}

async function fetchWebContent(url: string): Promise<FetchedWebContent> {
  // SSRF 防护（见 security-design.md）
  validateUrl(url);

  const response = await axios.get(url, {
    timeout: 10000,
    maxContentLength: 10 * 1024 * 1024,  // 10MB
    maxRedirects: 3,
    headers: {
      "User-Agent": "PPTAgent/1.0 (Content Extraction)",
      "Accept": "text/html,application/xhtml+xml",
    },
    responseType: "text",
  });

  const $ = cheerio.load(response.data);

  // 移除无关元素
  $("script, style, nav, header, footer, iframe, noscript, aside, .ad, .sidebar").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim();

  // 提取正文
  const textContent = $("article, main, .content, .post-body, body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();

  return {
    title,
    text: textContent,
    url,
    wordCount: textContent.split(/\s+/).length,
  };
}
```

### 5.3 SSRF 防护

```typescript
import { URL } from "url";
import { isIP } from "net";

const BLOCKED_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
];

function validateUrl(urlString: string): void {
  const parsed = new URL(urlString);

  // 仅允许 http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS protocols are allowed");
  }

  // 检查 hostname
  const hostname = parsed.hostname;

  if (hostname === "localhost" || hostname === "[::1]") {
    throw new Error("Access to localhost is not allowed");
  }

  if (isIP(hostname)) {
    for (const pattern of BLOCKED_IP_RANGES) {
      if (pattern.test(hostname)) {
        throw new Error("Access to internal IP addresses is not allowed");
      }
    }
  }
}
```

### 5.4 错误处理

| 错误 | 处理 |
|------|------|
| 超时 | 重试 2 次，仍超时则返回错误 |
| 403/404 | 直接返回错误，提示用户 URL 无法访问 |
| 内容过少 | `wordCount < 50` 时标记 `contentQuality: "low"` |
| 非 HTML 响应 | 检查 Content-Type，非 HTML 则拒绝 |

---

## 6. SVG → PNG 转换集成

### 6.1 库选择

使用 `@resvg/resvg-js` 进行 SVG 渲染，`sharp` 进行图片后处理。

```
npm install @resvg/resvg-js sharp
```

### 6.2 接口封装

```typescript
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

interface RenderOptions {
  width?: number;    // 输出宽度，默认 1920
  height?: number;   // 输出高度，默认 1080
  quality?: number;  // PNG 质量 0-100，默认 90
}

async function svgToPng(
  svgContent: string,
  outputPath: string,
  options: RenderOptions = {}
): Promise<void> {
  const { width = 1920, height = 1080, quality = 90 } = options;

  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: "width",
      value: width,
    },
    font: {
      loadSystemFonts: true,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  await sharp(pngBuffer)
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality })
    .toFile(outputPath);
}
```

### 6.3 缩略图生成

缩略图使用较小尺寸以减少存储和传输：

```typescript
async function generateThumbnail(
  svgContent: string,
  outputPath: string
): Promise<void> {
  await svgToPng(svgContent, outputPath, {
    width: 384,
    height: 216,
    quality: 80,
  });
}
```

### 6.4 批量转换

导出时需批量转换所有幻灯片：

```typescript
async function batchSvgToPng(
  slides: Array<{ svg: string; outputPath: string }>,
  concurrency: number = 3
): Promise<void> {
  const queue = new PQueue({ concurrency });

  await Promise.all(
    slides.map((slide) =>
      queue.add(() => svgToPng(slide.svg, slide.outputPath))
    )
  );
}
```

### 6.5 已知限制

| 限制 | 说明 | 应对方案 |
|------|------|----------|
| foreignObject 支持 | resvg-js 对 `<foreignObject>` 支持有限 | 文本 slot 使用 `<text>` 元素替代渲染 |
| 自定义字体 | 需要系统安装对应字体 | 部署时预装常用字体（见部署文档） |
| CSS 动画 | 静态渲染，忽略动画 | 按最终帧渲染（动画定义不影响） |
| 超大 SVG | >500KB 的 SVG 渲染可能较慢 | 限制单页 SVG 元素上限 500 个 |

---

## 7. PPTX 生成集成

### 7.1 库选择

使用 `pptxgenjs`，纯 JavaScript 实现，运行在 Node.js 端。

```
npm install pptxgenjs
```

### 7.2 接口封装

```typescript
import PptxGenJS from "pptxgenjs";

interface ExportOptions {
  slides: Array<{
    pngPath: string;     // 该幻灯片的 PNG 路径
    width: number;       // 1920
    height: number;      // 1080
  }>;
  outputPath: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

async function generatePptx(options: ExportOptions): Promise<string> {
  const pptx = new PptxGenJS();

  // 设置幻灯片尺寸为 16:9
  pptx.defineLayout({ name: "CUSTOM", width: 13.33, height: 7.5 });
  pptx.layout = "CUSTOM";

  // 设置元数据
  if (options.metadata) {
    pptx.title = options.metadata.title;
    pptx.author = options.metadata.author;
    pptx.subject = options.metadata.subject;
  }

  // 逐页插入 PNG
  for (const slideData of options.slides) {
    const slide = pptx.addSlide();
    const pngBase64 = await fs.readFile(slideData.pngPath, { encoding: "base64" });

    slide.addImage({
      data: `image/png;base64,${pngBase64}`,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });
  }

  // 写入文件
  await pptx.writeFile({ fileName: options.outputPath });

  return options.outputPath;
}
```

### 7.3 导出流程

```
1. 收集所有 Slide 的 generatedSvg
2. 批量 SVG → PNG（1920×1080）
3. 组装 PPTX（PNG 全屏插入）
4. 保存到 /uploads/exports/{projectId}/
5. 返回下载 URL
6. 通过 SSE 推送进度和完成事件
```

---

## 8. 依赖版本与兼容性

### 8.1 核心依赖

| 包名 | 建议版本 | 说明 |
|------|----------|------|
| `openai` | ^4.x | OpenAI-compatible SDK |
| `axios` | ^1.x | HTTP 客户端 |
| `cheerio` | ^1.x | HTML 解析 |
| `pdf-parse` | ^1.x | PDF 文本提取 |
| `sharp` | ^0.33.x | 图片处理 |
| `@resvg/resvg-js` | ^2.x | SVG 渲染 |
| `pptxgenjs` | ^3.x | PPTX 生成 |
| `p-queue` | ^8.x | 并发队列 |
| `dompurify` | ^3.x | SVG/HTML 净化 |
| `ajv` | ^8.x | JSON Schema 校验 |

### 8.2 系统依赖

| 依赖 | 用途 | 安装方式 |
|------|------|----------|
| Node.js >= 18 | 运行时 | 预装 |
| 常用中文字体 | SVG 渲染文字 | 部署时安装（详见部署文档） |

---

## 9. 环境变量完整清单

```env
# === 必须 ===
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-secret-key-at-least-32-chars
LLM_BASE_URL=https://api.example.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat

# === 可选（有默认值） ===
PORT=3000
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3
LLM_MOCK_ENABLED=false
LLM_MOCK_DELAY=500
UNSPLASH_ACCESS_KEY=
IMAGE_SEARCH_ENABLED=true
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
```
