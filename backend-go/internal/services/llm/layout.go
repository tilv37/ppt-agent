package llm

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/yourusername/ppt-agent-backend/pkg/utils"
)

// LayoutService provides layout DSL generation and validation services
type LayoutService struct {
	client *LLMClient
}

// NewLayoutService creates a new layout service
func NewLayoutService(client *LLMClient) *LayoutService {
	return &LayoutService{
		client: client,
	}
}

// GenerateDSL generates a layout DSL from an image and user prompt
func (s *LayoutService) GenerateDSL(imageURL, userPrompt, category string) (string, error) {
	// Convert local file path to base64 if needed
	processedImageURL, err := utils.ConvertImageURLToBase64(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to process image URL: %w", err)
	}

	// Build request
	req := &ChatRequest{
		Model: s.client.visionModel,
		Messages: []Message{
			CreateTextMessage("system", GetDSLGenerationSystemPrompt()),
			CreateVisionMessage("user", GetDSLGenerationUserPrompt(userPrompt, category), processedImageURL),
		},
		Stream: false,
	}

	// Call LLM with retry
	resp, err := s.client.ChatCompletionWithRetry(req, 3)
	if err != nil {
		return "", fmt.Errorf("failed to generate DSL: %w", err)
	}

	// Extract text content
	content, err := ExtractTextContent(resp)
	if err != nil {
		return "", fmt.Errorf("failed to extract content: %w", err)
	}

	// Extract JSON from response (handle markdown code blocks)
	dslJson, err := extractJSON(content)
	if err != nil {
		return "", fmt.Errorf("failed to extract JSON: %w", err)
	}

	// Validate JSON format
	if !isValidJSON(dslJson) {
		return "", fmt.Errorf("generated DSL is not valid JSON")
	}

	return dslJson, nil
}

// ValidateDSL validates a layout DSL and returns validation result
func (s *LayoutService) ValidateDSL(dslJson string, userFeedback *string) (*ValidationResult, error) {
	feedback := ""
	if userFeedback != nil {
		feedback = *userFeedback
	}

	// Build request
	req := &ChatRequest{
		Model: s.client.model,
		Messages: []Message{
			CreateTextMessage("system", GetDSLValidationSystemPrompt()),
			CreateTextMessage("user", GetDSLValidationUserPrompt(dslJson, feedback)),
		},
		Stream: false,
	}

	// Call LLM with retry
	resp, err := s.client.ChatCompletionWithRetry(req, 3)
	if err != nil {
		return nil, fmt.Errorf("failed to validate DSL: %w", err)
	}

	// Extract text content
	content, err := ExtractTextContent(resp)
	if err != nil {
		return nil, fmt.Errorf("failed to extract content: %w", err)
	}

	// Extract JSON from response
	resultJson, err := extractJSON(content)
	if err != nil {
		return nil, fmt.Errorf("failed to extract validation result: %w", err)
	}

	// Parse validation result
	var result ValidationResult
	if err := json.Unmarshal([]byte(resultJson), &result); err != nil {
		return nil, fmt.Errorf("failed to parse validation result: %w", err)
	}

	return &result, nil
}

// CorrectDSL corrects a layout DSL based on user feedback
func (s *LayoutService) CorrectDSL(dslJson, userFeedback string) (string, error) {
	// Build request
	req := &ChatRequest{
		Model: s.client.model,
		Messages: []Message{
			CreateTextMessage("system", GetDSLCorrectionSystemPrompt()),
			CreateTextMessage("user", GetDSLCorrectionUserPrompt(dslJson, userFeedback)),
		},
		Stream: false,
	}

	// Call LLM with retry
	resp, err := s.client.ChatCompletionWithRetry(req, 3)
	if err != nil {
		return "", fmt.Errorf("failed to correct DSL: %w", err)
	}

	// Extract text content
	content, err := ExtractTextContent(resp)
	if err != nil {
		return "", fmt.Errorf("failed to extract content: %w", err)
	}

	// Extract JSON from response
	correctedJson, err := extractJSON(content)
	if err != nil {
		return "", fmt.Errorf("failed to extract corrected DSL: %w", err)
	}

	// Validate JSON format
	if !isValidJSON(correctedJson) {
		return "", fmt.Errorf("corrected DSL is not valid JSON")
	}

	return correctedJson, nil
}

// extractJSON extracts JSON from text that may contain markdown code blocks
func extractJSON(text string) (string, error) {
	text = strings.TrimSpace(text)

	// Strategy 1: Try to parse directly
	if isValidJSON(text) {
		return text, nil
	}

	// Strategy 2: Extract from markdown code block
	codeBlockRegex := regexp.MustCompile("```(?:json)?\\s*([\\s\\S]*?)```")
	matches := codeBlockRegex.FindStringSubmatch(text)
	if len(matches) > 1 {
		jsonStr := strings.TrimSpace(matches[1])
		if isValidJSON(jsonStr) {
			return jsonStr, nil
		}
	}

	// Strategy 3: Find JSON object by braces
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start != -1 && end != -1 && end > start {
		jsonStr := text[start : end+1]
		if isValidJSON(jsonStr) {
			return jsonStr, nil
		}
	}

	return "", fmt.Errorf("no valid JSON found in response")
}

// isValidJSON checks if a string is valid JSON
func isValidJSON(str string) bool {
	var js json.RawMessage
	return json.Unmarshal([]byte(str), &js) == nil
}
