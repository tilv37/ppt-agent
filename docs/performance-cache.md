# PPT 自动生成 Web 系统 - 性能与缓存策略

## 1. 概述

### 1.1 性能目标

| 指标 | 目标值 |
|------|--------|
| 页面首屏加载 | < 2 秒 |
| 缩略图列表滚动 | 60fps |
| SVG 主预览切换 | < 200ms |
| 10 页 PPT 完整生成 | < 5 分钟 |
| 单页聊天编辑响应 | < 30 秒 |
| PPT 导出（10 页） | < 15 秒 |

### 1.2 性能瓶颈分析

| 环节 | 瓶颈 | 影响 |
|------|------|------|
| LLM 调用 | 单次 2-15 秒，多 Agent 累计 | 生成总时长 |
| SVG 渲染 | 复杂 SVG DOM 计算量大 | 预览流畅度 |
| 图片搜索+下载 | 外部网络延迟 | 视觉处理阶段时长 |
| 导出渲染 | SVG → Canvas → PNG 逐页转换 | 导出等待时间 |

---

## 2. LLM 调用优化

### 2.1 并发控制

```
全局 LLM 并发上限: 3（可配置）

并行策略：
- ContentWriterAgent: 多页可并行生成（每 3 页一批）
- LayoutSelectorAgent: 多页可并行匹配
- VisualDecisionAgent: 所有页一次性决策
- GraphicGeneratorAgent + ImageSearchAgent: 每页独立，并行执行
- QualityReviewAgent: 必须在所有页面完成后串行执行
```

### 2.2 Streaming 输出

所有 LLM 调用启用 streaming：

```typescript
const stream = await openai.chat.completions.create({
  model: config.model,
  messages,
  stream: true,
});

// 流式接收，减少首字节等待
for await (const chunk of stream) {
  // 实时将进度通过 SSE 推送给前端
}
```

### 2.3 Prompt 优化

- 避免在 prompt 中重复发送完整模板库，仅发送相关模板
- 大纲确认后缓存 outline，后续 Agent 直接引用
- 对较长的原始内容做摘要后传给非关键 Agent

---

## 3. 前端渲染优化

### 3.1 SVG 缩略图

缩略图不使用原始 SVG 实时渲染，而是使用预生成的 PNG：

```
生成流程：
1. Agent 完成页面生成 → 输出 generatedSvg
2. 后端将 SVG 渲染为 PNG（canvg 或 puppeteer）
3. 保存为 /uploads/slides/{projectId}/{slideId}.png
4. 前端缩略图使用 <img src="...png"> 展示
```

优势：
- 避免同时渲染多个完整 SVG 导致 DOM 开销
- PNG 文件可被浏览器缓存
- 缩略图尺寸固定（例如 384×216），文件量小

### 3.2 主预览区懒加载

```
策略：
- 仅渲染当前选中页的完整 SVG
- 前一页和后一页预加载 SVG（prefetch）
- 其余页面使用缩略图 PNG
- 切换页面时：先展示 PNG → 再替换为完整 SVG（避免白屏）
```

### 3.3 虚拟滚动

左栏缩略图列表使用虚拟滚动：

```
- 页面数 > 20 时启用虚拟滚动
- 仅渲染可视区域 ± 2 个缩略图的 DOM
- 使用 react-virtualized 或 @tanstack/virtual
```

### 3.4 SVG 渲染优化

```
针对复杂 SVG：
- 限制单页 SVG 元素上限 500 个
- foreignObject 中的 HTML 保持简单（仅 div/span/p）
- 避免深层嵌套的 <g> 元素（最大 5 层）
- 使用 will-change: transform 优化动画层
- 导出前去除所有动画定义
```

---

## 4. 缓存策略

### 4.1 服务端缓存

#### LLM 响应缓存

对于确定性输入（相同内容 + 相同 prompt），缓存 LLM 输出：

```
缓存 key: hash(agentName + promptVersion + inputHash)
存储: 内存缓存（Map），进程级
TTL: 30 分钟
场景: 同一项目重新生成、回压重试时避免重复调用
```

> 注意：仅对 temperature=0 的 Agent 启用缓存（ChatIntentClassifier、LayoutSelectorAgent）

#### 模板数据缓存

```
缓存 key: templateId
存储: 内存缓存
TTL: 进程生命周期（模板数据变更时手动清除）
场景: LayoutSelectorAgent 频繁读取模板列表
```

#### 图片代理缓存

```
缓存 key: hash(imageUrl)
存储: 磁盘 /uploads/cache/
TTL: 24 小时
场景: 避免重复下载第三方图片
上限: 1 GB，LRU 淘汰
```

### 4.2 客户端缓存

#### HTTP 缓存头

| 资源类型 | Cache-Control |
|----------|---------------|
| 缩略图 PNG | `public, max-age=3600, stale-while-revalidate=86400` |
| 模板 SVG | `public, max-age=86400` |
| API 响应 | `private, no-cache`（需认证） |
| 静态资源 (JS/CSS) | `public, max-age=31536000, immutable` |

#### React Query 缓存

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30 秒内认为数据新鲜
      gcTime: 5 * 60 * 1000,      // 5 分钟后回收
      refetchOnWindowFocus: false,
    },
  },
});

// 项目列表：较长缓存
useQuery({ queryKey: ['projects'], staleTime: 60_000 });

// 幻灯片数据：短缓存（可能被编辑）
useQuery({ queryKey: ['slides', presentationId], staleTime: 10_000 });

// 模板列表：长缓存
useQuery({ queryKey: ['templates'], staleTime: 300_000 });
```

---

## 5. 导出性能优化

### 5.1 SVG → PNG 批量转换

```
策略：
- 使用 Web Worker 进行 SVG → Canvas → PNG 转换
- 每次并行转换 3 页（避免内存溢出）
- 转换分辨率：1920×1080（与模板一致）
- 使用 OffscreenCanvas（若浏览器支持）
```

### 5.2 PPTX 组装

```
工具：pptxgenjs
策略：
- PNG 图片以全屏方式插入每页
- 预先计算所有 PNG，再一次性组装 PPTX
- 组装过程在主线程执行（pptxgenjs 不支持 Worker）
- 生成的 PPTX 文件触发浏览器下载
```

### 5.3 导出进度反馈

```
SSE 事件：
event: export_progress
data: {"current": 3, "total": 10, "phase": "rendering"}

event: export_progress
data: {"current": 10, "total": 10, "phase": "assembling"}

event: export_done
data: {"downloadUrl": "/uploads/exports/xxx/report.pptx"}
```

---

## 6. 数据库性能

### 6.1 查询优化

```
索引已在 database-design.md 中定义，核心查询路径：

1. 项目列表 → idx_project_userId + cursor 分页
2. 幻灯片列表 → idx_slide_presentationId
3. 聊天记录 → idx_chat_projectId + createdAt 排序
4. Agent 追踪 → idx_tracer_projectId + idx_tracer_agentName
```

### 6.2 大字段处理

```
generatedSvg 和 contentJson 可能较大：
- 列表查询时排除这些字段（Prisma select）
- 仅在详情查询时返回
- 缩略图使用预生成 PNG，不需要实时解析 SVG
```

### 6.3 SQLite 优化配置

```sql
PRAGMA journal_mode=WAL;        -- 提升并发读写性能
PRAGMA synchronous=NORMAL;      -- 平衡安全性和性能
PRAGMA cache_size=-64000;       -- 64MB 缓存
PRAGMA foreign_keys=ON;         -- 启用外键约束
```

---

## 7. 监控指标

### 7.1 关键指标

| 指标 | 采集方式 | 告警阈值 |
|------|----------|----------|
| LLM 调用延迟 | 代码埋点 | P95 > 30 秒 |
| LLM 调用失败率 | 代码埋点 | > 10% |
| 管线完成时间 | AgentTrace | P95 > 8 分钟 |
| 导出耗时 | 代码埋点 | P95 > 30 秒 |
| 内存占用 | process.memoryUsage() | > 1 GB |
| SQLite 文件大小 | 定时检查 | > 500 MB |

### 7.2 日志格式

```json
{
  "timestamp": "2026-04-01T12:00:00Z",
  "level": "info",
  "module": "agent",
  "agent": "ContentWriterAgent",
  "projectId": "uuid",
  "slideIndex": 2,
  "duration": 3500,
  "status": "success",
  "message": "Slide content generated"
}
```
