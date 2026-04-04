package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/yourusername/ppt-agent-backend/internal/config"
)

// LLMClient handles communication with LLM APIs
type LLMClient struct {
	baseURL     string
	apiKey      string
	model       string
	visionModel string
	timeout     time.Duration
	httpClient  *http.Client
	semaphore   chan struct{} // Concurrency control
}

// NewLLMClient creates a new LLM client
func NewLLMClient(cfg *config.LLMConfig) *LLMClient {
	return &LLMClient{
		baseURL:     cfg.BaseURL,
		apiKey:      cfg.APIKey,
		model:       cfg.Model,
		visionModel: cfg.VisionModel,
		timeout:     cfg.Timeout,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
		semaphore: make(chan struct{}, cfg.MaxConcurrency),
	}
}

// ChatCompletion sends a chat completion request to the LLM API
func (c *LLMClient) ChatCompletion(req *ChatRequest) (*ChatResponse, error) {
	// Acquire semaphore (concurrency control)
	c.semaphore <- struct{}{}
	defer func() { <-c.semaphore }()

	// Marshal request body
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequest("POST", c.baseURL+"/chat/completions", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	// Send request
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check for error response
	if resp.StatusCode != http.StatusOK {
		var errResp ErrorResponse
		if err := json.Unmarshal(respBody, &errResp); err == nil {
			return nil, fmt.Errorf("LLM API error: %s", errResp.Error.Message)
		}
		return nil, fmt.Errorf("LLM API error: status %d, body: %s", resp.StatusCode, string(respBody))
	}

	// Parse success response
	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &chatResp, nil
}

// ChatCompletionWithRetry sends a chat completion request with retry logic
func (c *LLMClient) ChatCompletionWithRetry(req *ChatRequest, maxRetries int) (*ChatResponse, error) {
	var lastErr error

	for i := range maxRetries {
		resp, err := c.ChatCompletion(req)
		if err == nil {
			return resp, nil
		}

		lastErr = err

		// Don't retry on last attempt
		if i < maxRetries-1 {
			// Exponential backoff: 1s, 2s, 4s
			backoff := time.Duration(1<<uint(i)) * time.Second
			time.Sleep(backoff)
		}
	}

	return nil, fmt.Errorf("failed after %d retries: %w", maxRetries, lastErr)
}

// CreateTextMessage creates a text-only message
func CreateTextMessage(role, text string) Message {
	return Message{
		Role: role,
		Content: []ContentPart{
			{
				Type: "text",
				Text: &text,
			},
		},
	}
}

// CreateVisionMessage creates a message with text and image
func CreateVisionMessage(role, text, imageURL string) Message {
	return Message{
		Role: role,
		Content: []ContentPart{
			{
				Type: "text",
				Text: &text,
			},
			{
				Type: "image_url",
				ImageURL: &ImageURL{
					URL: imageURL,
				},
			},
		},
	}
}

// ExtractTextContent extracts text content from a chat response
func ExtractTextContent(resp *ChatResponse) (string, error) {
	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	choice := resp.Choices[0]
	if len(choice.Message.Content) == 0 {
		return "", fmt.Errorf("no content in message")
	}

	// Find text content
	for _, part := range choice.Message.Content {
		if part.Type == "text" && part.Text != nil {
			return *part.Text, nil
		}
	}

	return "", fmt.Errorf("no text content found")
}
