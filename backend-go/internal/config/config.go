package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all application configuration
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	LLM      LLMConfig
	Upload   UploadConfig
	CORS     CORSConfig
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port string
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	URL string
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret    string
	ExpiresIn string
}

// LLMConfig holds LLM service configuration
type LLMConfig struct {
	BaseURL        string
	APIKey         string
	Model          string
	VisionModel    string
	Timeout        time.Duration
	MaxConcurrency int
}

// UploadConfig holds file upload configuration
type UploadConfig struct {
	MaxFileSize   int64  // in bytes
	AllowedTypes  []string
	UploadDir     string
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins []string
}

var globalConfig *Config

// Load loads configuration from environment variables
func Load() *Config {
	if globalConfig != nil {
		return globalConfig
	}

	globalConfig = &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
		},
		Database: DatabaseConfig{
			URL: getEnv("DATABASE_URL", "./data/ppt-agent.db"),
		},
		JWT: JWTConfig{
			Secret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production-32chars-minimum"),
			ExpiresIn: getEnv("JWT_EXPIRES_IN", "168h"),
		},
		LLM: LLMConfig{
			BaseURL:        getEnv("LLM_BASE_URL", "https://api.openai.com/v1"),
			APIKey:         getEnv("LLM_API_KEY", ""),
			Model:          getEnv("LLM_MODEL", "gpt-3.5-turbo"),
			VisionModel:    getEnv("VISION_LLM_MODEL", "gpt-4-vision-preview"),
			Timeout:        time.Duration(getEnvInt("LLM_TIMEOUT", 60000)) * time.Millisecond,
			MaxConcurrency: getEnvInt("LLM_MAX_CONCURRENCY", 3),
		},
		Upload: UploadConfig{
			MaxFileSize:  getEnvInt64("UPLOAD_MAX_FILE_SIZE", 5*1024*1024), // 5MB default
			AllowedTypes: []string{"image/png", "image/jpeg", "image/jpg"},
			UploadDir:    getEnv("UPLOAD_DIR", "uploads"),
		},
		CORS: CORSConfig{
			AllowedOrigins: []string{
				"http://localhost:5173",
				"http://localhost:3000",
			},
		},
	}

	return globalConfig
}

// Get returns the global configuration
func Get() *Config {
	if globalConfig == nil {
		return Load()
	}
	return globalConfig
}

// Helper functions

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}
