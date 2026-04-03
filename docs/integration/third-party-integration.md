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

---

（文档继续，已移入此文件）