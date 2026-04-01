# PPT 自动生成 Web 系统 - SVG 模板规范文档

## 1. 概述

### 1.1 模板定义

每个模板由两部分组成：
- **SVG 骨架文件**: 静态视觉框架，包含背景、装饰元素和 slot 占位
- **Schema JSON 文件**: 定义 slot 的名称、类型、边界框、约束规则

### 1.2 设计原则

- 模板尺寸统一为 **1920×1080** 像素（16:9）
- Slot 通过 SVG 元素的 `id` 和 `class` 命名约定标识
- 系统提供内置基础模板，用户可导入自定义模板
- 模板支持 CSS/SMIL 动画定义（预览时播放，导出时忽略）

---

## 2. SVG 骨架规范

### 2.1 根元素

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1920 1080"
     width="1920"
     height="1080"
     data-template-version="1">
  <defs>
    <!-- 全局样式、渐变、滤镜 -->
  </defs>
  <!-- 背景层 -->
  <!-- 装饰层 -->
  <!-- Slot 层 -->
</svg>
```

### 2.2 图层规范

SVG 内容按以下顺序分层（使用 `<g>` 分组）：

| 图层 | id | 说明 |
|------|-----|------|
| 背景层 | `layer-bg` | 背景色、渐变、背景图案 |
| 装饰层 | `layer-decor` | 几何装饰、线条、色块 |
| 内容层 | `layer-content` | 所有 slot 占位元素 |
| 动画层 | `layer-anim` | 动画定义（可选） |

```xml
<g id="layer-bg">
  <rect width="1920" height="1080" fill="#1a1a2e"/>
</g>
<g id="layer-decor">
  <circle cx="1700" cy="200" r="300" fill="#16213e" opacity="0.5"/>
</g>
<g id="layer-content">
  <!-- slots here -->
</g>
<g id="layer-anim">
  <!-- animation definitions -->
</g>
```

### 2.3 Slot 元素命名约定

Slot 占位元素使用以下 id 命名规则：

```
slot-{type}[-{index}]
```

示例：

| id | 说明 |
|----|------|
| `slot-title` | 主标题 |
| `slot-subtitle` | 副标题 |
| `slot-body` | 正文区域 |
| `slot-bullets` | 要点列表 |
| `slot-image` | 图片区域 |
| `slot-image-0`, `slot-image-1` | 多图时带索引 |
| `slot-chart` | 图表区域 |
| `slot-diagram` | 结构图区域 |
| `slot-footer` | 页脚信息 |
| `slot-page-num` | 页码 |

### 2.4 Slot 占位元素格式

Slot 在 SVG 中用 `<rect>` 占位，附带 `class="slot"` 标记：

```xml
<rect id="slot-title"
      class="slot slot-text"
      x="120" y="80"
      width="1680" height="120"
      fill="none" stroke="#ccc" stroke-dasharray="4"/>

<rect id="slot-image"
      class="slot slot-media"
      x="960" y="200"
      width="840" height="680"
      fill="none" stroke="#ccc" stroke-dasharray="4"/>
```

**class 分类**：

| class | 说明 |
|-------|------|
| `slot-text` | 文本类 slot（title/subtitle/body/bullets/footer/page-num） |
| `slot-media` | 媒体类 slot（image/chart/diagram） |

### 2.5 动画定义

模板可在 `layer-anim` 或各元素上定义 CSS/SMIL 动画。

CSS 动画示例：
```xml
<defs>
  <style>
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #slot-title { animation: fadeInUp 0.6s ease-out; }
    #slot-subtitle { animation: fadeInUp 0.6s ease-out 0.2s both; }
  </style>
</defs>
```

**规则**：
- 动画仅在 Web 预览中播放
- 导出 PPT 时忽略所有动画，按最终帧渲染
- 动画总时长建议不超过 2 秒
- 禁止使用 JavaScript 动画

---

## 3. Schema JSON 规范

### 3.1 顶层结构

```json
{
  "templateId": "uuid",
  "name": "简约商务封面",
  "category": "cover",
  "version": 1,
  "slots": [ ... ],
  "metadata": {
    "author": "system",
    "description": "适用于正式汇报的简约风格封面",
    "tags": ["商务", "简约", "封面"],
    "hasAnimation": true
  }
}
```

### 3.2 Slot 定义

```json
{
  "id": "slot-title",
  "type": "text",
  "label": "主标题",
  "required": true,
  "bbox": {
    "x": 120,
    "y": 80,
    "width": 1680,
    "height": 120
  },
  "constraints": {
    "maxChars": 30,
    "maxLines": 2,
    "fontSize": { "min": 36, "max": 72 },
    "fontWeight": "bold",
    "textAlign": "center",
    "color": "#ffffff"
  }
}
```

### 3.3 Slot 类型枚举

| type | 说明 | 约束字段 |
|------|------|----------|
| `text` | 单行或多行文本 | maxChars, maxLines, fontSize, fontWeight, textAlign, color |
| `bullets` | 要点列表 | maxItems, maxCharsPerItem, bulletStyle, fontSize, color |
| `image` | 外部图片 | aspectRatio, objectFit, borderRadius |
| `chart` | 图表 SVG | chartTypes (允许的图表类型数组) |
| `diagram` | 结构图 SVG | 无特殊约束 |

### 3.4 各类型约束字段详解

#### text 类型

```json
{
  "id": "slot-subtitle",
  "type": "text",
  "label": "副标题",
  "required": false,
  "bbox": { "x": 120, "y": 220, "width": 1680, "height": 60 },
  "constraints": {
    "maxChars": 60,
    "maxLines": 1,
    "fontSize": { "min": 18, "max": 28 },
    "fontWeight": "normal",
    "textAlign": "center",
    "color": "#cccccc",
    "overflow": "truncate"
  }
}
```

`overflow` 可选值：
- `truncate`: 超出截断（不推荐）
- `rewrite`: 要求 ContentWriterAgent 精简后重写（推荐）
- `shrink`: 缩小字号适配

#### bullets 类型

```json
{
  "id": "slot-bullets",
  "type": "bullets",
  "label": "核心要点",
  "required": true,
  "bbox": { "x": 120, "y": 300, "width": 800, "height": 600 },
  "constraints": {
    "maxItems": 5,
    "maxCharsPerItem": 40,
    "bulletStyle": "disc",
    "fontSize": { "min": 16, "max": 24 },
    "lineSpacing": 1.6,
    "color": "#e0e0e0"
  }
}
```

`bulletStyle` 可选值：`disc`, `decimal`, `dash`, `arrow`, `none`

#### image 类型

```json
{
  "id": "slot-image",
  "type": "image",
  "label": "配图",
  "required": false,
  "bbox": { "x": 960, "y": 200, "width": 840, "height": 680 },
  "constraints": {
    "aspectRatio": "4:3",
    "objectFit": "cover",
    "borderRadius": 8
  }
}
```

`objectFit` 可选值：`cover`, `contain`, `fill`

#### chart 类型

```json
{
  "id": "slot-chart",
  "type": "chart",
  "label": "数据图表",
  "required": false,
  "bbox": { "x": 480, "y": 250, "width": 960, "height": 600 },
  "constraints": {
    "chartTypes": ["bar", "pie", "line", "radar"]
  }
}
```

---

## 4. 模板分类

### 4.1 分类列表

| category 值 | 说明 | 典型 slot 组合 |
|-------------|------|----------------|
| `cover` | 封面页 | title, subtitle |
| `toc` | 目录页 | title, bullets |
| `section` | 章节过渡页 | title, subtitle |
| `text` | 纯文本分析页 | title, body/bullets |
| `image_text` | 图文混排页 | title, bullets, image |
| `dual` | 双栏对比页 | title, bullets-0, bullets-1 |
| `chart` | 数据图表页 | title, chart, footer |
| `diagram` | 流程/结构页 | title, diagram |
| `quote` | 引用/金句页 | title, body |
| `conclusion` | 结论/建议页 | title, bullets |

### 4.2 内置模板清单（第一版）

系统至少提供以下内置模板：

| 编号 | 名称 | 分类 | 说明 |
|------|------|------|------|
| 1 | 深色简约封面 | cover | 深色背景 + 居中大标题 |
| 2 | 浅色商务封面 | cover | 白底 + 左对齐标题 + 右侧装饰 |
| 3 | 简约目录 | toc | 编号列表 + 左侧色条 |
| 4 | 章节过渡 | section | 全屏色块 + 居中标题 |
| 5 | 左文右图 | image_text | 左侧要点 + 右侧配图 |
| 6 | 左图右文 | image_text | 左侧配图 + 右侧要点 |
| 7 | 纯要点 | text | 标题 + 多行要点 |
| 8 | 双栏对比 | dual | 标题 + 左右两列要点 |
| 9 | 柱状图页 | chart | 标题 + 图表区域 |
| 10 | 流程图页 | diagram | 标题 + 结构图区域 |
| 11 | 引用页 | quote | 大字引用 + 来源标注 |
| 12 | 结论建议页 | conclusion | 标题 + 总结要点 |

---

## 5. 模板渲染流程

### 5.1 Slot 注入流程

```
1. 读取模板 SVG 骨架
2. 读取 Schema JSON
3. 遍历 Schema 中的 slots
4. 对每个 slot：
   a. 在 SVG 中找到对应 id 的占位元素
   b. 根据 slot type 生成替换内容
   c. 文本类：生成 <text> 或 <foreignObject> 元素
   d. 图片类：生成 <image> 元素
   e. 图表/结构图类：嵌入生成的 SVG 片段
5. 移除占位 <rect> 元素
6. 输出最终 SVG
```

### 5.2 文本渲染策略

对于文本类 slot，使用 `<foreignObject>` 实现自动换行：

```xml
<foreignObject x="120" y="80" width="1680" height="120">
  <div xmlns="http://www.w3.org/1999/xhtml"
       style="font-size:48px; font-weight:bold; color:#fff; text-align:center;">
    Q1 工作汇报
  </div>
</foreignObject>
```

### 5.3 图片渲染策略

```xml
<image href="/uploads/slides/xxx/img.jpg"
       x="960" y="200" width="840" height="680"
       preserveAspectRatio="xMidYMid slice"/>
```

`preserveAspectRatio` 映射：
- `cover` -> `xMidYMid slice`
- `contain` -> `xMidYMid meet`
- `fill` -> `none`

---

## 6. 模板导入规范

### 6.1 从截图导入流程

```
1. 用户上传参考截图（PNG/JPG）
2. 视觉模型分析截图布局
3. 识别出区域划分和内容类型
4. 生成 SVG 骨架初稿 + Schema JSON 初稿
5. 用户校验并手动调整
6. 保存为自定义模板
```

### 6.2 导入校验规则

| 校验项 | 规则 |
|--------|------|
| viewBox | 必须为 `0 0 1920 1080` |
| 至少一个 slot | 必须包含至少一个 `class="slot"` 元素 |
| slot id 唯一 | 同一模板内 slot id 不允许重复 |
| bbox 范围 | 所有 slot 的 bbox 必须在 0~1920 / 0~1080 范围内 |
| Schema 与 SVG 一致 | Schema 中每个 slot 必须在 SVG 中有对应 id 元素 |

---

## 7. 附录：完整模板示例

### 7.1 SVG 骨架 (cover-dark.svg)

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1920 1080"
     width="1920" height="1080"
     data-template-version="1">
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
    <style>
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #slot-title { animation: fadeInUp 0.8s ease-out; }
      #slot-subtitle { animation: fadeInUp 0.8s ease-out 0.3s both; }
    </style>
  </defs>

  <g id="layer-bg">
    <rect width="1920" height="1080" fill="url(#bg-grad)"/>
  </g>

  <g id="layer-decor">
    <circle cx="1600" cy="250" r="400" fill="#0f3460" opacity="0.3"/>
    <rect x="0" y="900" width="1920" height="4" fill="#e94560" opacity="0.8"/>
  </g>

  <g id="layer-content">
    <rect id="slot-title" class="slot slot-text"
          x="200" y="380" width="1520" height="120"
          fill="none"/>
    <rect id="slot-subtitle" class="slot slot-text"
          x="200" y="530" width="1520" height="60"
          fill="none"/>
  </g>
</svg>
```

### 7.2 Schema JSON (cover-dark.json)

```json
{
  "templateId": "builtin-cover-dark",
  "name": "深色简约封面",
  "category": "cover",
  "version": 1,
  "slots": [
    {
      "id": "slot-title",
      "type": "text",
      "label": "主标题",
      "required": true,
      "bbox": { "x": 200, "y": 380, "width": 1520, "height": 120 },
      "constraints": {
        "maxChars": 25,
        "maxLines": 2,
        "fontSize": { "min": 42, "max": 64 },
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#ffffff",
        "overflow": "rewrite"
      }
    },
    {
      "id": "slot-subtitle",
      "type": "text",
      "label": "副标题",
      "required": false,
      "bbox": { "x": 200, "y": 530, "width": 1520, "height": 60 },
      "constraints": {
        "maxChars": 50,
        "maxLines": 1,
        "fontSize": { "min": 20, "max": 28 },
        "fontWeight": "normal",
        "textAlign": "center",
        "color": "#aaaaaa",
        "overflow": "truncate"
      }
    }
  ],
  "metadata": {
    "author": "system",
    "description": "深色渐变背景，居中大标题，适用于正式汇报封面",
    "tags": ["商务", "深色", "简约"],
    "hasAnimation": true
  }
}
```
