# 参数化 DSL 系统使用指南

## 概述

参数化 DSL 系统允许你创建通用的布局模板，具体参数（如列数、元素数量、尺寸比例）在使用时由 LayoutSelectorAgent 根据实际内容动态决定。

## 核心概念

### 1. 参数化 DSL 模板

参考截图只是展示布局模式，不固定具体数值。例如：
- 截图显示 4 列 → 定义 `columnCount` 参数（min: 2, max: 6, default: 4）
- 截图显示 5 个要点 → 定义 `maxItems` 参数（min: 3, max: 8, default: 5）

### 2. 参数引用语法

在 DSL 中使用 `{$paramName}` 引用参数值：
```json
{
  "gridConfig": {
    "columns": "{$columnCount}"
  }
}
```

### 3. 动态重复

使用 `repeat` 和 `{i}` 实现动态生成元素：
```json
{
  "slots": [
    {
      "id": "column-{i}",
      "type": "text",
      "repeat": "{$columnCount}"
    }
  ]
}
```

## 完整示例

### 参数化的多列布局

```json
{
  "layoutId": "multi-column-layout",
  "name": "多列布局",
  "category": "content",
  "description": "可变列数的多列布局，根据内容数量动态调整",
  "canvas": {"width": 1920, "height": 1080},
  
  "parameters": {
    "columnCount": {
      "type": "integer",
      "default": 3,
      "min": 2,
      "max": 6,
      "description": "列数，由 Agent 根据内容项数量决定"
    },
    "itemsPerColumn": {
      "type": "integer",
      "default": 5,
      "min": 3,
      "max": 8,
      "description": "每列的项目数"
    },
    "columnRatio": {
      "type": "array",
      "default": [1, 1, 1],
      "description": "列宽比例，数组长度等于 columnCount"
    },
    "contentType": {
      "type": "enum",
      "default": "text",
      "options": ["text", "image", "mixed"],
      "description": "列内容类型"
    }
  },
  
  "regions": [
    {
      "id": "header",
      "type": "text",
      "bounds": {"x": 60, "y": 60, "width": 1800, "height": 100}
    },
    {
      "id": "columns-container",
      "type": "container",
      "bounds": {"x": 60, "y": 180, "width": 1800, "height": 800},
      "layout": "grid",
      "gridConfig": {
        "columns": "{$columnCount}",
        "columnRatio": "{$columnRatio}",
        "gap": 40
      },
      "slots": [
        {
          "id": "column-{i}",
          "type": "{$contentType}",
          "repeat": "{$columnCount}",
          "constraints": {
            "maxItems": "{$itemsPerColumn}",
            "fontSize": 20
          }
        }
      ]
    }
  ],
  
  "styles": {
    "fontFamily": "Inter",
    "primaryColor": "#004ac6"
  }
}
```

## 使用流程

### 1. 创建参数化模板

上传参考截图 + 描述，LLM 会生成参数化 DSL：

```bash
POST /api/v1/layout-patterns
{
  "mode": "ai",
  "name": "多列布局",
  "description": "可变列数的布局",
  "category": "content",
  "imageUrl": "https://example.com/4-column-layout.png",
  "userPrompt": "这是一个多列布局，列数可以根据内容调整"
}
```

### 2. LayoutSelectorAgent 选择并实例化

Agent 分析页面内容，决定参数值：

```typescript
// 页面内容：6 个并列要点
const pageContent = {
  title: "产品特性",
  content: "特性1、特性2、特性3、特性4、特性5、特性6",
  itemCount: 6
};

// Agent 决定：使用 3 列，每列 2 项
const parameters = {
  columnCount: 3,
  itemsPerColumn: 2,
  columnRatio: [1, 1, 1],
  contentType: "text"
};
```

### 3. 实例化 DSL

```bash
POST /api/v1/layout-patterns/instantiate
{
  "dslJson": "{...参数化 DSL...}",
  "parameters": {
    "columnCount": 3,
    "itemsPerColumn": 2,
    "columnRatio": [1, 1, 1],
    "contentType": "text"
  }
}
```

返回实例化后的 DSL（不再包含 parameters 字段，所有参数引用已替换为具体值）。

## 参数类型

### integer
整数类型，用于列数、项数等：
```json
{
  "columnCount": {
    "type": "integer",
    "default": 3,
    "min": 2,
    "max": 6
  }
}
```

### float
浮点数类型，用于比例：
```json
{
  "imageRatio": {
    "type": "float",
    "default": 1.5,
    "min": 1.0,
    "max": 2.0
  }
}
```

### array
数组类型，用于比例列表：
```json
{
  "columnRatio": {
    "type": "array",
    "default": [3, 7]
  }
}
```

### enum
枚举类型，用于内容类型：
```json
{
  "contentType": {
    "type": "enum",
    "default": "text",
    "options": ["text", "image", "chart", "mixed"]
  }
}
```

### boolean
布尔类型，用于开关：
```json
{
  "showFooter": {
    "type": "boolean",
    "default": true
  }
}
```

## 测试

### 单元测试

```bash
cd backend-go
go test ./internal/services/layout/...
```

### 手动测试

1. 创建参数化模板
2. 使用不同参数实例化
3. 验证生成的 DSL 正确性

示例：
```bash
# 测试 3 列
curl -X POST http://localhost:8080/api/v1/layout-patterns/instantiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dslJson": "...",
    "parameters": {"columnCount": 3}
  }'

# 测试 5 列
curl -X POST http://localhost:8080/api/v1/layout-patterns/instantiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dslJson": "...",
    "parameters": {"columnCount": 5}
  }'
```

## 最佳实践

1. **合理的默认值**：选择最常见的场景作为默认值
2. **适当的范围**：min/max 应该覆盖实际使用场景
3. **清晰的描述**：帮助 Agent 理解参数用途
4. **语义化命名**：使用清晰的参数名（columnCount 而非 n）
5. **类型一致性**：确保参数类型与使用场景匹配

## 常见模式

### 左右分栏（可变比例）
```json
{
  "parameters": {
    "leftRatio": {"type": "integer", "default": 3, "min": 2, "max": 5},
    "rightRatio": {"type": "integer", "default": 7, "min": 5, "max": 8}
  }
}
```

### 网格布局（可变行列）
```json
{
  "parameters": {
    "rows": {"type": "integer", "default": 2, "min": 1, "max": 4},
    "columns": {"type": "integer", "default": 3, "min": 2, "max": 6}
  }
}
```

### 混合内容（可变类型）
```json
{
  "parameters": {
    "leftType": {"type": "enum", "options": ["image", "chart"], "default": "image"},
    "rightType": {"type": "enum", "options": ["text", "bullet-list"], "default": "text"}
  }
}
```

## 故障排查

### 参数未替换
- 检查参数名是否正确
- 确保使用 `{$paramName}` 语法
- 验证参数在 parameters 字段中定义

### repeat 未展开
- 确保 repeat 值是整数或参数引用
- 检查 slots 数组结构
- 验证参数值类型正确

### 类型不匹配
- 确保参数类型与使用场景匹配
- integer 用于数量，array 用于列表
- enum 需要定义 options

## 下一步

- 实现 LayoutSelectorAgent（Phase 3）
- 集成到完整生成流程
- 添加更多参数化模板示例
