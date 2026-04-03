# PPT 自动生成 Web 系统设计文档

## 1. 文档目标

本文档用于定义一个面向特定业务场景的 PPT 自动生成 Web 系统的完整设计方案，覆盖以下内容：

- 业务目标与产品边界
- 核心功能需求与非功能需求
- 用户角色与用户交互流程
- 页面规划、布局、功能和交互细节
- 多 Agent + ReAct 技术架构
- 数据模型、接口设计、状态流转
- 模板体系、图片智能处理、自绘图形策略
- 开发实施建议、阶段划分、风险与降级策略

本文档目标不是停留在概念层，而是提供一份可以直接指导项目落地、任务拆分和后续研发实现的方案。

---

## 2. 产品定位

### 2.1 产品定义

本系统是一个通过 Web B/S 方式使用的 PPT 自动生成工具，主要服务于特定行业或有限用户群体。它不负责开放式地替用户完成完整知识采集，而是围绕“用户已具备原始材料”的前提，完成以下工作：

- 接收用户提供的原始内容
- 将内容整理为适合 PPT 展示的结构化大纲
- 自动决定每页主题、页间逻辑关系与页数分配
- 结合模板和视觉策略生成页面级 SVG 幻灯片
- 支持用户通过自然语言聊天持续修改已有页面或新增后续页面
- 最终导出为 PPT 文件

### 2.2 产品边界

本系统负责：

- 解析 TXT、Markdown、PDF、URL 等输入内容
- 基于页数目标和业务语境生成 PPT 大纲
- 根据模板系统完成版式匹配
- 判断是否需要图片、图表或图形
- 在适合时自绘图表、结构图、信息图
- 在无法自绘时进行网络搜图和图片理解筛选
- 生成可编辑的页面结果并导出 PPT

本系统不负责：

- 作为通用搜索引擎进行大范围开放研究
- 替代专业设计师进行像素级人工排版
- 实现复杂 PPT 原生动画、触发器和母版体系
- 完整替代 Office 级别的所见即所得编辑器

### 2.3 目标价值

- 降低从原始资料到可展示 PPT 的时间成本
- 让非设计人员也能快速得到结构较完整、风格一致的初稿
- 通过多 Agent 协作提升质量，而不是单次生成的一次性结果
- 通过聊天式迭代降低二次修改门槛

---

## 3. 用户与使用场景

### 3.1 目标用户

- 咨询顾问、方案经理、售前、行业分析人员
- 需要频繁产出固定风格汇报材料的团队成员
- 已有企业内部模板/视觉规范，但缺少自动化生产能力的组织

### 3.2 典型使用场景

场景一：基于报告和 PDF 生成汇报材料

- 用户上传 PDF 与一段说明文字
- 设定目标为 10 页
- 系统分析文档并规划 10 页结构
- 用户确认大纲后生成初版 PPT
- 用户通过聊天修改若干页面并导出

场景二：基于网页链接与文字要求生成方案型 PPT

- 用户输入多个 URL 与目标页数
- 系统抽取网页正文并生成方案型目录结构
- 对适合的页面自动插入示意图或信息图

场景三：基于长文本说明快速形成内部汇报

- 用户粘贴较长的会议纪要或分析结果
- 系统提炼成章节、分论点、结论页和行动建议页
- 用户继续补充“再加一页风险分析”之类的后续页面需求

---

## 4. 总体产品设计原则

### 4.1 质量优先于速度

本系统不采用“单轮对话直接输出 PPT”的方式，而采用多 Agent + ReAct 的逐步生成模式，以换取更高的大纲质量、版式匹配度和视觉准确性。

### 4.2 用户控制优先

- 大纲阶段设置人工确认节点
- 生成后保留可持续编辑能力
- 聊天输入支持区分“修改现有内容”和“新增后续页面”

### 4.3 模板驱动而非完全自由生成

由于目标用户群体较垂直，系统应围绕用户自建模板库工作，追求风格稳定和结果可控，而不是完全自由风格生成。

### 4.4 视觉能力分层处理

视觉内容按能力分层：

- 能自绘的图表、结构图、简单信息图，优先自绘
- 不适合自绘的真实图片、场景照片，通过搜索和视觉理解筛选

### 4.5 Web 端完成主要交互

系统核心体验均在 Web 中完成，包括：

- 项目管理
- 内容输入
- 生成过程观察
- 大纲确认
- 幻灯片预览与聊天编辑
- 导出 PPT

---

## 5. 核心功能需求

### 5.1 项目管理

系统需要具备完整的 PPT 项目管理能力。

功能要求：

- 创建新的 PPT 项目
- 查看历史项目列表
- 打开项目继续编辑
- 重命名项目
- 复制已有项目
- 删除项目
- 保存每个项目独立的页面数据、聊天记录和生成历史

业务规则：

- 每个项目是一个独立 session 的容器
- 一个项目对应一份 Presentation 数据与一条主聊天线程
- 项目创建后，进入该项目的内容输入与生成流程

### 5.2 内容输入与资料接收

系统支持以下输入方式：

- 粘贴大段文本
- 上传 TXT 文件
- 上传 Markdown 文件
- 上传 PDF 文件
- 输入网页链接 URL

系统需要：

- 提取文本正文
- 清洗噪声内容
- 允许用户补充生成意图说明
- 允许设置期望页数
- 允许补充“目标风格/目标用途/受众对象”等约束描述

### 5.3 大纲生成

系统基于内容与目标页数生成结构化大纲。

输出内容至少包括：

- 总标题建议
- 页面数量建议
- 每页主题
- 每页核心要点摘要
- 每页可能适用的模板类型
- 每页是否建议使用图像或图形

大纲生成不是一次定稿，而是多 Agent 规划后的中间结果。

### 5.4 大纲确认

大纲生成后必须暂停，等待用户确认。

用户可进行的操作：

- 调整页数
- 修改某一页主题
- 删除某一页
- 新增某一页
- 调整顺序
- 直接输入新的结构性要求

确认后系统才继续进入页面渲染阶段。

### 5.5 页面生成与模板应用

系统根据大纲、模板库、版式规则生成每一页的 SVG 幻灯片。

要求：

- 每页都从模板库中选择最合适模板
- 文本需适配对应 slot 的尺寸与字数限制
- 对溢出内容进行重写或压缩，而不是简单截断
- 保证整份 PPT 在视觉风格上统一

### 5.6 图片与图形处理

系统应具备“判断是否需要视觉元素”的能力。

若需要视觉元素，分为两类：

- 自绘图形
- 搜索真实图片

自绘范围包括：

- 柱状图、饼图、折线图
- 流程图、架构图、节点箭头图
- 图标与几何图形组合
- 时间轴、对比结构、简单信息图

当无法自绘或自绘不合适时，系统需：

- 自动形成图片搜索关键词
- 调用配置好的图片搜索服务
- 获取若干候选图片
- 使用视觉模型评分最匹配图片
- 将最佳图片插入相应 slot

### 5.7 聊天式二次编辑

生成后，用户在编辑器内通过右侧聊天面板发起修改。

聊天需支持两类意图：

- EDIT：修改当前已有页面
- ADD：新增后续页面

示例：

- “把第 3 页标题改成更正式一些” -> EDIT
- “在这页后面再增加一页风险分析” -> ADD

系统要求：

- 自动识别聊天意图
- 在 UI 中以标签展示意图结果
- 用户可以手动纠正意图标签
- EDIT 默认作用于当前选中页
- 若未选中页面，则尝试从用户语句中识别页码或页名
- ADD 默认插入到当前页之后，若无选中页则追加到结尾

### 5.8 模板管理

系统需要提供完整的模板管理能力，包括排版范式管理和素材库管理。

#### 5.8.1 排版范式管理

功能要求：

- 上传排版截图（PNG/JPG）
- 输入排版描述（如"3列图标配文布局"）
- 系统调用 Vision LLM 识别布局结构
- 自动生成结构化的 LayoutPattern JSON
- 支持在线预览、编辑、删除排版范式
- 支持搜索和分类

业务规则：

- 每个排版范式包含：名称、描述、类别、布局参数、区域定义、约束条件
- 排版范式保存到数据库，供 LayoutSelectorAgent 使用
- 用户可以手动调整 Vision LLM 生成的结果

#### 5.8.2 素材库管理

功能要求：

- 上传 PPT 文件（.pptx）
- 后台异步提取素材（图标、插图、图表、装饰元素）
- 调用 Vision LLM 自动分类和标注
- 生成素材元数据（类型、标签、关键词、尺寸）
- 支持在线预览、编辑标签、删除素材
- 支持按类型、标签、关键词搜索

业务规则：

- 素材提取采用异步任务队列，避免阻塞
- 每个素材包含：类型、类别、标签、关键词、文件路径、尺寸、来源页码
- 素材保存到数据库和文件系统
- 支持增量上传，不需要每次全量处理

### 5.9 导出 PPT

导出时每一页 PPT 对应一张生成好的 SVG 页面。

推荐方案：

- 在浏览器端将 SVG 渲染为 Canvas
- 再转为 PNG
- 使用 PPTX 生成库写入每页全屏图片

要求：

- 导出结果可被 Microsoft PowerPoint 正常打开
- 页面比例与 Web 预览一致
- 导出过程在用户可接受范围内完成

---

## 6. 非功能需求

### 6.1 可维护性

- 架构要支持后续增加新的 Agent、模板类型和图片搜索 Provider
- 前后端需要清晰分层
- Prompt、模板 schema、Agent 配置应尽量模块化

### 6.2 可解释性

生成过程要能让用户感知系统正在做什么。

要求：

- 提供 Agent 进度流
- 允许查看摘要级 ReAct 执行信息
- 错误时能定位是哪个阶段失败

### 6.3 性能

- 页面切换与缩略图浏览要流畅
- 大纲生成和渲染过程中要持续反馈进度
- 图片搜索和视觉评分阶段需要做并发控制，避免接口风暴

### 6.4 一致性

- 同一项目内字体、颜色、版式风格一致
- 同一类页面尽可能使用一组风格近似模板

### 6.5 安全性

- 对用户上传内容做基础校验
- 对 URL 抓取进行超时与域名控制
- 对 SVG 注入内容进行 sanitize
- 对第三方图片 URL 做安全代理或缓存策略

---

## 7. 技术方案总览

### 7.1 技术选型

- 前后端框架：Next.js 14 + TypeScript
- UI：React + Tailwind CSS
- 数据库：SQLite + Prisma
- LLM 调用：OpenAI SDK，兼容 OpenAI 风格接口，可接 DeepSeek/Qwen 等
- Vision LLM：GPT-4V / Claude 3.5 Sonnet / Qwen-VL（用于图片识别）
- 任务队列：BullMQ 或 p-queue（异步处理大文件）
- PDF 解析：pdfjs-dist
- PPTX 解析：pptxgenjs 或 officegen
- URL 抽取：服务端抓取 + cheerio
- 图片处理：sharp（压缩、转换、裁剪）
- SVG 渲染：React SVG 组件 + 模板 slot 注入
- 导出 PPT：canvg + pptxgenjs

### 7.2 系统架构总览

#### 7.2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Project Mgmt │  │ Editor Canvas│  │ Template Management  │  │
│  │   Pages      │  │  + Chat UI   │  │  (Layout + Assets)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ REST API + SSE
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services (Next.js API)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth Service │  │ Project Svc  │  │ Template Service     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Pipeline Svc │  │ Chat Service │  │ Export Service       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Multi-Agent System                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              OrchestratorAgent (协调器)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Content      │→ │ Outline      │→ │ Content Writer       │  │
│  │ Extraction   │  │ Planner      │  │ Agent                │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                              ↓                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Layout       │← │ Visual       │← │ Asset Matcher        │  │
│  │ Selector     │  │ Decision     │  │ Agent                │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Graphic      │  │ Image Search │  │ SVG Renderer         │  │
│  │ Generator    │  │ Agent        │  │ Agent                │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              QualityReviewAgent (质量审查)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Template Management System                    │
│  ┌──────────────────────────────┐  ┌────────────────────────┐  │
│  │  Layout Pattern Extractor    │  │  Asset Classifier      │  │
│  │  (Vision LLM Recognition)    │  │  (Vision LLM + Queue)  │  │
│  └──────────────────────────────┘  └────────────────────────┘  │
│  ┌──────────────────────────────┐  ┌────────────────────────┐  │
│  │  Layout Pattern Storage      │  │  Asset Storage         │  │
│  │  (Database + JSON)           │  │  (Database + Files)    │  │
│  └──────────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ SQLite DB    │  │ File Storage │  │ Task Queue           │  │
│  │ (Prisma ORM) │  │ (uploads/)   │  │ (BullMQ/p-queue)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ LLM API      │  │ Vision LLM   │  │ Image Search API     │  │
│  │ (DeepSeek)   │  │ (GPT-4V)     │  │ (Unsplash)           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.2.2 核心模块说明

**1. Web Frontend**
- 项目管理页面：创建、列表、打开、删除项目
- 编辑器画布：幻灯片预览、缩略图导航、聊天面板
- 模板管理：排版范式管理、素材库管理

**2. Backend Services**
- Auth Service：JWT 认证、用户管理
- Project Service：项目 CRUD、状态管理
- Pipeline Service：多 Agent 协调、SSE 进度推送
- Chat Service：聊天意图识别、单页编辑
- Template Service：排版范式和素材管理
- Export Service：SVG → PNG → PPTX 导出

**3. Multi-Agent System**
- 11 个专业 Agent 协同工作
- ReAct 模式：每个 Agent 最多 5 轮内部循环
- Back-pressure 机制：质量不达标时回退重试

**4. Template Management System**
- Layout Pattern Extractor：图片识别 → 排版范式
- Asset Classifier：PPT 提取 → 素材分类
- 异步任务队列处理大文件

**5. Data Layer**
- SQLite 数据库：10 个表（新增 LayoutPattern、Asset）
- 文件存储：上传文件、生成的 SVG、导出的 PPTX
- 任务队列：异步处理素材提取

#### 7.2.3 数据流图

**PPT 生成主流程**：

```
用户输入内容
    ↓
ContentExtractionAgent (提取文本)
    ↓
OutlinePlannerAgent (生成大纲)
    ↓
用户确认大纲
    ↓
ContentWriterAgent (编写每页内容)
    ↓
LayoutSelectorAgent (选择排版范式 + 决定参数)
    ↓
VisualDecisionAgent (判断是否需要视觉元素)
    ↓
AssetMatcherAgent (匹配素材库)
    ↓
GraphicGeneratorAgent / ImageSearchAgent (生成图形 / 搜索图片)
    ↓
SVGRendererAgent (渲染 SVG)
    ↓
QualityReviewAgent (质量审查)
    ↓
生成完成，用户预览
    ↓
聊天式编辑 (ChatService)
    ↓
导出 PPTX
```

**模板管理流程**：

```
排版范式管理：
用户上传截图 + 描述
    ↓
LayoutPatternExtractorAgent (Vision LLM 识别)
    ↓
生成 LayoutPattern JSON
    ↓
保存到数据库
    ↓
供 LayoutSelectorAgent 使用

素材库管理：
用户上传 PPT
    ↓
异步任务队列
    ↓
逐页解析提取图片
    ↓
AssetClassifierAgent (Vision LLM 分类)
    ↓
生成 Asset 记录
    ↓
保存到数据库 + 文件系统
    ↓
供 AssetMatcherAgent 使用
```

---

## 8. 多 Agent 系统详细设计

### 8.1 Agent 总览

系统包含 11 个专业 Agent：

| # | Agent 名称 | 职责 | 输入 | 输出 |
|---|-----------|------|------|------|
| 0 | OrchestratorAgent | 协调整个生成流程 | 项目配置 | 完整 Presentation |
| 1 | ContentExtractionAgent | 提取和清洗原始内容 | 文件/URL | 纯文本 |
| 2 | OutlinePlannerAgent | 生成结构化大纲 | 文本 + 页数 | 大纲 JSON |
| 3 | ContentWriterAgent | 编写每页具体内容 | 大纲 + 页面主题 | 页面内容 |
| 4 | LayoutSelectorAgent | 选择排版范式并决定参数 | 页面内容 | LayoutPattern + 参数 |
| 5 | VisualDecisionAgent | 判断是否需要视觉元素 | 页面内容 | 视觉需求 |
| 6 | AssetMatcherAgent | 匹配素材库中的资源 | 内容 + 关键词 | Asset 列表 |
| 7 | GraphicGeneratorAgent | 生成图表和图形 | 数据 + 类型 | SVG 图形 |
| 8 | ImageSearchAgent | 搜索和筛选图片 | 关键词 | 图片 URL |
| 9 | SVGRendererAgent | 渲染最终 SVG 页面 | 内容 + 布局 + 素材 | SVG |
| 10 | QualityReviewAgent | 质量审查和改进建议 | 完整页面 | 评分 + 建议 |

### 8.2 新增 Agent 详细设计

#### 8.2.1 LayoutPatternExtractorAgent

**职责**：从用户上传的排版截图中识别布局结构，生成 LayoutPattern JSON。

**输入**：
- 排版截图（PNG/JPG）
- 用户描述文字

**处理流程**：
1. 调用 Vision LLM 分析图片
2. 识别区域划分（标题、内容、图片等）
3. 判断布局类型（grid/flex/columns）
4. 提取参数（列数、间距、对齐方式）
5. 生成 LayoutPattern JSON

**输出**：
```typescript
{
  id: string;
  name: string;
  description: string;
  category: "content" | "cover" | "section" | "conclusion";
  layout: { type, params };
  regions: RegionTemplate[];
  constraints: { itemCount, textPerItem, requiresVisual };
  assetRequirements?: { type, perItem, placement };
}
```

#### 8.2.2 AssetClassifierAgent

**职责**：从 PPT 提取的图片中识别类型和语义信息。

**输入**：
- 提取的图片文件
- 来源页码和位置

**处理流程**：
1. 调用 Vision LLM 分析图片
2. 识别类型（icon/illustration/chart/decoration）
3. 提取语义关键词
4. 生成标签和描述
5. 计算尺寸和宽高比

**输出**：
```typescript
{
  id: string;
  type: "icon" | "illustration" | "chart" | "decoration";
  category: string;
  tags: string[];
  keywords: string[];
  description?: string;
  file: { path, format, size };
  dimensions: { width, height, aspectRatio };
  source: { page, position };
}
```

---

## 9. 布局与素材系统设计

### 9.1 排版范式（Layout Pattern）系统

#### 9.1.1 数据结构

```typescript
interface LayoutPattern {
  id: string;
  name: string;
  description: string;
  category: "content" | "cover" | "section" | "conclusion";
  
  layout: {
    type: "grid" | "flex" | "columns";
    params: {
      minColumns: number;
      maxColumns: number;
      gap: number;
      alignment?: "left" | "center" | "right";
    };
  };
  
  regions: RegionTemplate[];
  
  constraints: {
    itemCount: [number, number];
    textPerItem: { min: number; max: number };
    requiresVisual: boolean;
  };
  
  assetRequirements?: {
    type: "icon" | "illustration" | "chart";
    perItem: boolean;
    placement: "top" | "left" | "right";
  };
  
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 9.1.2 管理流程

**创建流程**：
1. 用户上传排版截图
2. 输入描述（如"3列图标配文"）
3. LayoutPatternExtractorAgent 识别
4. 生成 LayoutPattern JSON
5. 保存到数据库

**使用流程**：
1. LayoutSelectorAgent 加载所有 Pattern
2. 根据页面内容选择最合适的 Pattern
3. 决定动态参数（如列数）
4. 传递给 SVGRendererAgent

### 9.2 素材库（Asset Library）系统

#### 9.2.1 数据结构

```typescript
interface Asset {
  id: string;
  type: "icon" | "illustration" | "chart" | "decoration";
  category: string;
  tags: string[];
  keywords: string[];
  description?: string;
  
  file: {
    path: string;
    format: "svg" | "png" | "jpg";
    size: number;
  };
  
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  
  semantic: {
    relatedConcepts?: string[];
  };
  
  source: {
    page?: number;
    position?: string;
    sourceFile?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### 9.2.2 提取流程

**PPT 素材提取**：
1. 用户上传 PPT 文件
2. 创建异步任务（BullMQ）
3. 逐页解析 PPT（pptxgenjs）
4. 提取图片、形状、图表
5. AssetClassifierAgent 分类识别
6. 保存到数据库 + 文件系统
7. 更新进度通知用户

**匹配流程**：
1. AssetMatcherAgent 接收页面内容
2. 提取关键词和标签
3. 在素材库中搜索匹配
4. 计算匹配分数
5. 返回最佳匹配结果

---

## 10. 数据库设计

### 10.1 新增表

#### LayoutPattern 表

```prisma
model LayoutPattern {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String
  layoutJson  String   // JSON 存储
  imageUrl    String?
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([createdAt])
}
```

#### Asset 表

```prisma
model Asset {
  id          String   @id @default(cuid())
  type        String
  category    String
  tags        String   // JSON array
  keywords    String   // JSON array
  description String?
  filePath    String
  fileFormat  String
  fileSize    Int
  width       Int
  height      Int
  aspectRatio String
  sourcePage  Int?
  sourceFile  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([type])
  @@index([category])
  @@index([createdAt])
}
```

---

## 11. API 设计

### 11.1 排版范式管理 API

```
POST   /api/v1/layout-patterns          创建排版范式（图片识别）
GET    /api/v1/layout-patterns          列表
GET    /api/v1/layout-patterns/:id      详情
PUT    /api/v1/layout-patterns/:id      更新
DELETE /api/v1/layout-patterns/:id      删除
```

### 11.2 素材库管理 API

```
POST   /api/v1/assets/upload-ppt        上传 PPT 提取素材
GET    /api/v1/assets/tasks/:taskId     查询提取进度
GET    /api/v1/assets                   列表（支持搜索）
GET    /api/v1/assets/:id               详情
PUT    /api/v1/assets/:id               更新标签
DELETE /api/v1/assets/:id               删除
```

---

## 12. 页面设计

### 12.1 模板管理页面

**路由**：`/templates`

**功能模块**：
1. 排版范式管理（`/templates/layout-patterns`）
2. 素材库管理（`/templates/assets`）

#### 12.1.1 排版范式管理页面

**布局**：
- 左侧：排版范式列表（卡片式）
- 右侧：详情/编辑面板

**功能**：
- 上传截图 + 描述
- 查看识别进度
- 预览生成的 JSON
- 编辑 JSON（代码编辑器）
- 删除排版范式
- 搜索和筛选

**交互流程**：
```
点击"新建排版范式"
  ↓
上传截图
  ↓
输入描述
  ↓
提交识别
  ↓
显示进度（Vision LLM 处理中）
  ↓
识别完成，显示预览
  ↓
用户确认或编辑
  ↓
保存到数据库
```

#### 12.1.2 素材库管理页面

**布局**：
- 顶部：搜索栏 + 筛选器（类型、标签）
- 主区域：素材网格（瀑布流）
- 右侧：详情面板

**功能**：
- 上传 PPT 文件
- 查看提取进度
- 预览素材
- 编辑标签和关键词
- 删除素材
- 按类型/标签/关键词搜索

**交互流程**：
```
点击"上传 PPT"
  ↓
选择文件
  ↓
提交上传
  ↓
创建异步任务
  ↓
显示进度条（已处理 X/Y 页）
  ↓
提取完成，显示素材列表
  ↓
用户可编辑标签
```

---

## 13. 实施计划

### 13.1 第一阶段：模板管理系统（5-7 天）

**Phase 1.1：数据库和 API（2 天）**
- 创建 LayoutPattern 和 Asset 表
- 实现 CRUD API
- 单元测试

**Phase 1.2：排版范式管理（2 天）**
- 实现 LayoutPatternExtractorAgent
- 实现上传和识别流程
- 创建管理页面

**Phase 1.3：素材库管理（3 天）**
- 实现 AssetClassifierAgent
- 实现 PPT 解析和异步任务
- 创建管理页面
- 实现搜索功能

### 13.2 第二阶段：动态布局系统（10-12 天）

**Phase 2.1：排版范式系统（1-2 天）**
- 定义 TypeScript 接口
- 实现 PatternLoader 类
- 单元测试

**Phase 2.2：AssetMatcherAgent（2 天）**
- 实现匹配算法
- 实现降级策略
- 单元测试

**Phase 2.3：LayoutSelectorAgent 增强（2 天）**
- 加载排版范式列表
- 构建新的 system prompt
- 修改输出 schema

**Phase 2.4：SVGRendererAgent（3 天）**
- 实现布局计算
- 实现渲染逻辑
- 应用设计规范

**Phase 2.5：集成与测试（2 天）**
- 修改 OrchestratorAgent
- 端到端测试
- 性能优化

---

## 14. 技术风险与降级策略

### 14.1 Vision LLM 识别准确度

**风险**：图片识别可能不准确

**降级策略**：
- 提供手动编辑功能
- 保存识别历史，支持回退
- 提供示例模板参考

### 14.2 PPT 解析性能

**风险**：大文件处理慢，可能超时

**降级策略**：
- 异步任务队列
- 分页处理（每次 10-20 页）
- 进度实时反馈
- 支持取消任务

### 14.3 素材匹配质量

**风险**：匹配结果不理想

**降级策略**：
- 提供默认通用素材
- 支持手动选择素材
- 记录用户反馈优化算法

### 14.4 存储空间

**风险**：素材文件占用大量空间

**降级策略**：
- 图片压缩（sharp）
- 定期清理未使用素材
- 设置存储配额

---

## 15. 总结

### 15.1 核心价值

**模板管理系统**：
- 用户友好的图片识别方式
- 统一管理排版范式和素材
- 降低手动配置成本

**动态布局系统**：
- LLM 智能决策布局
- 充分复用公司素材库
- 灵活适应不同内容

### 15.2 技术亮点

1. **Vision LLM 应用**：排版识别 + 素材分类
2. **异步任务处理**：大文件不阻塞主流程
3. **语义匹配**：关键词 + 标签多维度匹配
4. **职责分离**：模板管理独立于生成流程

### 15.3 后续优化方向

1. **语义搜索增强**：使用 embedding 提升匹配准确度
2. **排版范式可视化预览**：在管理页面展示示例
3. **素材使用统计**：记录使用频率，优化推荐
4. **用户反馈循环**：收集反馈优化匹配算法
5. **批量操作**：支持批量上传、编辑、删除

---

*文档版本：v2.0*  
*最后更新：2026-04-03*