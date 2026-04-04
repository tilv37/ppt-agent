package llm

import "sync"

var (
	globalClient  *LLMClient
	globalService *LayoutService
	once          sync.Once
)

// InitGlobalService initializes the global LLM service
func InitGlobalService() {
	once.Do(func() {
		config := LoadConfig()
		globalClient = NewLLMClient(config)
		globalService = NewLayoutService(globalClient)
	})
}

// GetLayoutService returns the global layout service instance
func GetLayoutService() *LayoutService {
	if globalService == nil {
		InitGlobalService()
	}
	return globalService
}

// GetClient returns the global LLM client instance
func GetClient() *LLMClient {
	if globalClient == nil {
		InitGlobalService()
	}
	return globalClient
}
