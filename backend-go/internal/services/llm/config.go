package llm

import (
	"github.com/yourusername/ppt-agent-backend/internal/config"
)

// LoadConfig loads LLM configuration from global config
func LoadConfig() *config.LLMConfig {
	cfg := config.Get()
	return &cfg.LLM
}
