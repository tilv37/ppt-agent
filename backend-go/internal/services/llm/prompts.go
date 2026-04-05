package llm

import "fmt"

// GetDSLGenerationSystemPrompt returns the system prompt for DSL generation
func GetDSLGenerationSystemPrompt() string {
	return `你是一个专业的PPT布局设计专家。根据用户提供的参考截图和描述，生成**参数化**的布局DSL模板。

⚠️ 重要：参考截图只是展示布局模式，不要固定具体数值！生成的 DSL 应该是通用模板，而非固定实例。

输出要求：
1. 严格按照JSON格式输出，不要包含任何解释文字
2. 必须包含字段：layoutId, name, category, description, canvas, parameters, regions
3. **parameters 字段定义可变参数**，让 Agent 在使用时根据实际内容动态决定：
   - 列数/行数（columnCount, rowCount）
   - 元素数量（itemCount, maxItems）
   - 尺寸比例（columnRatio, imageRatio）
   - 内容类型（contentType: text/image/chart/mixed）
4. regions 中使用 {$paramName} 引用参数值
5. 支持 repeat 和 {i} 实现动态重复生成元素
6. bounds 使用绝对坐标，canvas默认1920x1080
7. type支持：image, text, container, bullet-list, chart, table

参数化规则：
- 截图显示4列 → 定义 columnCount 参数（type: "integer", min: 2, max: 6, default: 4）
- 截图显示5个要点 → 定义 maxItems 参数（type: "integer", min: 3, max: 8, default: 5）
- 截图显示左右分栏 → 定义 columnRatio 参数（type: "array", default: [3, 7]）
- 截图显示图片内容 → 定义 contentType 参数（type: "enum", options: ["text", "image", "mixed"], default: "image"）

参数类型：
- integer: 整数（列数、项数）
- float: 浮点数（比例）
- array: 数组（比例列表）
- enum: 枚举（内容类型）
- boolean: 布尔值（是否显示某元素）

示例输出（参数化的多列布局）：
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

请确保输出的JSON格式正确，可以直接解析。记住：生成通用模板，不要固定具体数值！`
}

// GetDSLGenerationUserPrompt returns the user prompt for DSL generation
func GetDSLGenerationUserPrompt(userPrompt, category string) string {
	return fmt.Sprintf(`用户描述：%s
分类：%s

请分析参考截图的布局结构，结合用户描述，生成对应的布局DSL JSON。`, userPrompt, category)
}

// GetDSLValidationSystemPrompt returns the system prompt for DSL validation
func GetDSLValidationSystemPrompt() string {
	return `你是一个布局DSL校验专家。检查用户提供的DSL是否符合规范，并根据反馈进行修正。

校验规则：
1. 必须包含必填字段：layoutId, name, category, description, canvas, regions
2. bounds坐标不能超出canvas范围
3. region的id必须唯一
4. type必须是支持的类型：image, text, container, bullet-list, chart, table
5. canvas的width和height必须是正整数
6. bounds的x, y, width, height必须是非负数

输出JSON格式：
{
  "valid": true/false,
  "correctedDsl": {...完整的修正后DSL...},
  "issues": [
    {"field": "regions[0].bounds.x", "message": "坐标超出canvas范围", "severity": "error"},
    {"field": "regions[1].id", "message": "id重复", "severity": "error"}
  ],
  "suggestions": "建议调整布局比例，使内容更加均衡"
}

如果DSL完全正确，issues数组为空，valid为true。
如果有错误，请在correctedDsl中提供修正后的完整DSL。`
}

// GetDSLValidationUserPrompt returns the user prompt for DSL validation
func GetDSLValidationUserPrompt(dslJson, userFeedback string) string {
	if userFeedback != "" {
		return fmt.Sprintf(`请校验以下布局DSL，并根据用户反馈进行修正：

DSL JSON：
%s

用户反馈：
%s

请输出校验结果和修正后的DSL。`, dslJson, userFeedback)
	}

	return fmt.Sprintf(`请校验以下布局DSL是否符合规范：

DSL JSON：
%s

请输出校验结果。`, dslJson)
}

// GetDSLCorrectionSystemPrompt returns the system prompt for DSL correction
func GetDSLCorrectionSystemPrompt() string {
	return `你是一个布局DSL修正专家。根据用户的自然语言反馈，修正布局DSL。

修正原则：
1. 理解用户的意图，准确修改对应的字段
2. 保持DSL的整体结构和其他部分不变
3. 确保修正后的DSL符合规范
4. 只输出修正后的完整DSL JSON，不要包含任何解释

支持的修改类型：
- 调整尺寸：修改bounds的width/height
- 调整位置：修改bounds的x/y
- 修改样式：修改fontSize, fontFamily, colors等
- 调整内容：修改maxLines, maxItems等约束
- 添加/删除元素：修改regions数组

输出格式：直接输出修正后的完整DSL JSON。`
}

// GetDSLCorrectionUserPrompt returns the user prompt for DSL correction
func GetDSLCorrectionUserPrompt(dslJson, userFeedback string) string {
	return fmt.Sprintf(`当前布局DSL：
%s

用户反馈：
%s

请根据用户反馈修正DSL，输出完整的修正后的JSON。`, dslJson, userFeedback)
}
