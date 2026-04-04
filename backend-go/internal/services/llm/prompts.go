package llm

import "fmt"

// GetDSLGenerationSystemPrompt returns the system prompt for DSL generation
func GetDSLGenerationSystemPrompt() string {
	return `你是一个专业的PPT布局设计专家。根据用户提供的参考截图和描述，生成结构化的布局DSL。

输出要求：
1. 严格按照JSON格式输出，不要包含任何解释文字
2. 必须包含字段：layoutId, name, category, description, canvas, regions
3. regions 数组定义页面区域，每个region包含：id, type, bounds
4. bounds 使用绝对坐标，canvas默认1920x1080
5. type支持：image, text, container, bullet-list, chart, table
6. 对于container类型，可以包含slots数组定义子元素

示例输出：
{
  "layoutId": "left-image-right-list",
  "name": "左图右列表",
  "category": "content",
  "description": "左侧大图，右侧标题+要点列表",
  "canvas": {"width": 1920, "height": 1080},
  "regions": [
    {
      "id": "left-image",
      "type": "image",
      "bounds": {"x": 60, "y": 150, "width": 850, "height": 800},
      "constraints": {"aspectRatio": "16:9", "minWidth": 400}
    },
    {
      "id": "right-content",
      "type": "container",
      "bounds": {"x": 1010, "y": 150, "width": 850, "height": 800},
      "slots": [
        {"id": "title", "type": "text", "maxLines": 2, "fontSize": 32},
        {"id": "bullets", "type": "bullet-list", "maxItems": 5, "fontSize": 24}
      ]
    }
  ],
  "styles": {
    "fontFamily": "Inter",
    "primaryColor": "#004ac6",
    "backgroundColor": "#ffffff"
  }
}

请确保输出的JSON格式正确，可以直接解析。`
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
