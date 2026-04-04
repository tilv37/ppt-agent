package llm

// ChatRequest represents a request to the LLM API
type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

// Message represents a chat message
type Message struct {
	Role    string        `json:"role"` // "system", "user", "assistant"
	Content []ContentPart `json:"content"`
}

// ContentPart represents a part of message content (text or image)
type ContentPart struct {
	Type     string    `json:"type"` // "text" or "image_url"
	Text     *string   `json:"text,omitempty"`
	ImageURL *ImageURL `json:"image_url,omitempty"`
}

// ImageURL represents an image URL in message content
type ImageURL struct {
	URL string `json:"url"`
}

// ChatResponse represents a response from the LLM API
type ChatResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Created int64    `json:"created"`
	Model   string   `json:"model"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

// Choice represents a completion choice
type Choice struct {
	Index        int     `json:"index"`
	Message      Message `json:"message"`
	FinishReason string  `json:"finish_reason"`
}

// Usage represents token usage information
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// ErrorResponse represents an error response from the LLM API
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains error details
type ErrorDetail struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Code    string `json:"code"`
}

// ValidationResult represents the result of DSL validation
type ValidationResult struct {
	Valid        bool     `json:"valid"`
	CorrectedDSL string   `json:"correctedDsl"`
	Issues       []Issue  `json:"issues"`
	Suggestions  *string  `json:"suggestions"`
}

// Issue represents a validation issue
type Issue struct {
	Field    string `json:"field"`
	Message  string `json:"message"`
	Severity string `json:"severity"` // "error", "warning"
}
