# PPT 自动生成 Web 系统 - 错误处理与降级流程

## 1. 概述

### 1.1 设计原则

- **快速失败**: 明确不可恢复的错误立即上报，不做无效重试
- **局部重试**: 单个 Agent 失败不应导致整条管线重来
- **降级兜底**: 重试耗尽后降级到安全状态，而非卡死
- **用户可感知**: 所有错误和降级通过 SSE 通知前端

### 1.2 全局约束

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| Agent 单次最大 ReAct 循环 | 5 | 每个 Agent 内部 Thought 循环上限 |
| Agent 间回压最大次数 | 2 | 同一 Slide 在两个 Agent 间来回修正的上限 |
| 整体管线超时 | 10 分钟 | 从 pipeline/start 到 done 的总超时 |
| 单个 Agent 调用超时 | 60 秒 | 单次 LLM API 调用超时 |
| 单个 Agent 重试次数 | 3 | 同一 Agent 同一输入的最大重试次数 |

---

## 2. 错误分类

### 2.1 可重试错误

| 错误类型 | 示例 | 重试策略 |
|----------|------|----------|
| LLM API 超时 | 网络抖动、模型响应慢 | 指数退避，最多 3 次 |
| LLM API 限流 | 429 Too Many Requests | 退避 + 降低并发 |
| LLM 输出格式错误 | JSON 解析失败 | 重新调用，附加格式提示 |
| Schema 校验失败 | 缺少必填字段 | 重新调用，附加纠错指令 |
| 图片下载超时 | 第三方图片服务慢 | 重试 2 次，超时 → 降级 |

### 2.2 不可重试错误

| 错误类型 | 示例 | 处理方式 |
|----------|------|----------|
| LLM API Key 无效 | 401 Unauthorized | 立即终止，通知用户检查配置 |
| 数据库写入失败 | SQLite 文件损坏 | 立即终止，记录日志 |
| 内容解析完全失败 | PDF 加密无法读取 | 终止该输入源，通知用户 |
| 管线超时 | 总时间超过 10 分钟 | 保存已完成部分，标记 error |

### 2.3 可降级错误

| 错误类型 | 示例 | 降级策略 |
|----------|------|----------|
| 图片搜索失败 | 搜图服务不可用 | 跳过图片，使用纯文本模板 |
| 图片评分过低 | 候选图都不合适 | 使用占位图或纯文本 |
| 自绘图形失败 | SVG 生成格式错误 | 跳过图形，保留文字内容 |
| 质量审查发现问题但已达回压上限 | 第 3 轮审查仍有问题 | 接受当前结果，附带警告 |

---

## 3. 各 Agent 错误处理详解

### 3.1 ContentExtractionAgent

```
输入 → 解析
  ├─ 成功 → 输出 ExtractedContent
  ├─ PDF 解析失败
  │    ├─ 重试 1 次（可能是临时 IO 错误）
  │    └─ 仍失败 → 返回 error，提示用户"PDF 无法解析，请检查文件是否加密或损坏"
  ├─ URL 抓取失败
  │    ├─ 超时重试 2 次
  │    └─ 仍失败 → 返回 error，提示用户"无法访问该 URL"
  └─ 内容质量过低 (contentQuality = "low")
       └─ 返回 warning，提示用户"内容较少，生成质量可能受限"，但继续流程
```

### 3.2 OutlinePlannerAgent

```
输入 → LLM 生成大纲
  ├─ 成功且 Schema 校验通过 → 输出 Outline
  ├─ JSON 格式错误
  │    └─ 重试（附加 "You must output valid JSON" 提示），最多 3 次
  ├─ 页数不匹配
  │    └─ 内部 ReAct 循环自我修正（最多 5 轮）
  └─ 3 次重试后仍失败
       └─ 返回 error，提示用户"大纲生成失败，请尝试简化输入内容"
```

### 3.3 ContentWriterAgent

```
输入大纲 → 逐页生成内容
  ├─ 单页成功 → 继续下一页
  ├─ 单页 JSON 错误 → 重试该页（最多 3 次）
  ├─ 单页内容溢出 → 标记 needs_revision（等待 LayoutSelector 回压）
  └─ 单页 3 次重试失败
       └─ 降级：使用大纲 keyPoints 作为原始内容直接填充，标记 warning
```

### 3.4 LayoutSelectorAgent

```
输入内容 → 匹配模板
  ├─ 完美匹配 → 输出 assignment
  ├─ 内容溢出
  │    ├─ 回压 ContentWriterAgent（最多 2 次）
  │    └─ 2 次回压后仍溢出
  │         └─ 降级：选择容量更大的模板，或使用 overflow="shrink" 缩小字号
  └─ 无匹配模板
       └─ 降级：使用通用纯文本模板 (text category)
```

### 3.5 VisualDecisionAgent

```
输入 → 决策
  ├─ 成功 → 输出决策
  └─ 失败
       └─ 降级：所有页面标记 needsVisual = false，跳过视觉处理
```

### 3.6 GraphicGeneratorAgent

```
输入 brief → 生成 SVG
  ├─ 成功且 SVG 合法 → 输出
  ├─ SVG 格式错误 → 重试（最多 3 次）
  ├─ SVG 元素过多（>200）→ 要求简化，重试 1 次
  └─ 3 次后仍失败
       └─ 降级：跳过该页图形，保留纯文本内容
```

### 3.7 ImageSearchAgent

```
生成关键词 → 搜索 → 评分 → 选择
  ├─ 成功（score >= 40）→ 输出选中图片
  ├─ 搜索服务不可用 → 重试 2 次
  │    └─ 仍不可用 → 降级：跳过图片
  ├─ 所有候选评分 < 40
  │    ├─ 尝试第二组关键词
  │    └─ 仍低分 → 降级：使用占位图标或跳过
  └─ 图片下载失败
       └─ 尝试下一候选，全部失败 → 降级：跳过图片
```

### 3.8 QualityReviewAgent

```
输入完整 deck → 审查
  ├─ overallScore >= 70 → approved
  ├─ overallScore < 70 且 revision 次数 < 2
  │    └─ 发起 revisionRequest → 对应 Agent 修正 → 重新审查
  └─ revision 次数 >= 2 仍 < 70
       └─ 强制 approved，附带 warnings 列表通知用户
```

---

## 4. 回压流程详解

### 4.1 LayoutSelector → ContentWriter 回压

```
LayoutSelectorAgent 发现 Slide 3 内容溢出 slot-bullets
  ↓
发出 revisionRequest:
  targetAgent: ContentWriterAgent
  slideIndex: 2
  instruction: "Reduce bullets to 4 items, max 35 chars each"
  ↓
OrchestratorAgent 收到回压请求
  ↓
检查回压计数: slide_2_layout_writer_count < 2
  ↓
调用 ContentWriterAgent 重写 Slide 2
  ↓
重新提交给 LayoutSelectorAgent
  ↓
若仍溢出且计数 = 2 → 降级处理
```

### 4.2 QualityReview → 各 Agent 回压

```
QualityReviewAgent 发现 Slide 5 与主题不一致
  ↓
发出 revisionRequest:
  targetAgent: OutlinePlannerAgent
  slideIndex: 4
  instruction: "Slide 5 topic drifts from the main theme, realign"
  ↓
OrchestratorAgent 检查全局 revision 计数 < 2
  ↓
调用 OutlinePlannerAgent 修正 → ContentWriterAgent 重写 → LayoutSelector 重新匹配
  ↓
重新提交 QualityReviewAgent
```

---

## 5. 管线中断与恢复

### 5.1 状态持久化

管线执行过程中，每完成一个阶段就持久化状态：

```
阶段完成 → 更新 Project.status
         → 写入 AgentTrace
         → 更新 Slide 状态
         → 持久化到 SQLite
```

### 5.2 可恢复节点

| 中断点 | 恢复方式 |
|--------|----------|
| 内容提取后 | 重新从 planning 阶段开始 |
| 大纲确认后 | 从 writing 阶段继续 |
| 部分页面已生成 | 从未完成的页面继续 |
| 视觉处理中断 | 跳过未完成的视觉，标记降级 |

### 5.3 中断恢复 API

```
POST /api/v1/pipeline/start
{
  "projectId": "uuid",
  "resume": true     ← 标记为恢复模式
}
```

恢复时 Orchestrator 读取已持久化的状态，跳过已完成阶段。

---

## 6. 前端错误展示

### 6.1 SSE 错误事件

```
event: error
data: {
  "phase": "visual",
  "agent": "GraphicGeneratorAgent",
  "slideIndex": 3,
  "severity": "warning",
  "message": "图形生成失败，已降级为纯文本展示",
  "recoverable": true
}
```

```
event: error
data: {
  "phase": "extraction",
  "agent": "ContentExtractionAgent",
  "severity": "critical",
  "message": "PDF 文件无法解析，请检查文件是否加密",
  "recoverable": false
}
```

### 6.2 前端展示策略

| severity | 展示方式 |
|----------|----------|
| info | Agent 进度卡片中显示灰色提示 |
| warning | 进度卡片显示黄色警告，生成完成后汇总展示 |
| critical | 红色错误弹窗，管线终止，提示用户操作 |

---

## 7. 降级策略汇总

| 场景 | 降级动作 | 用户通知 |
|------|----------|----------|
| 图片搜索失败 | 跳过图片，使用纯文本模板 | "第 X 页未能找到合适图片" |
| 图片评分全低 | 使用占位图标 | "第 X 页图片匹配度较低，已使用默认图标" |
| 自绘图形失败 | 跳过图形 | "第 X 页图表生成失败" |
| 内容溢出无法修正 | 缩小字号 | 无（静默降级） |
| 无匹配模板 | 使用通用文本模板 | 无（静默降级） |
| 质量审查不通过 | 接受当前结果 + 警告列表 | "生成结果存在以下问题：..." |
| 单页生成失败 | 大纲内容直接填充 | "第 X 页使用了简化内容" |
| 管线超时 | 保存已完成部分 | "生成超时，已保存已完成的 X 页" |
