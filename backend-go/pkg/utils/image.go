package utils

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ImageToBase64 converts an image file to base64 data URL
func ImageToBase64(filePath string) (string, error) {
	// Read file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	// Detect MIME type from file extension
	ext := strings.ToLower(filepath.Ext(filePath))
	var mimeType string
	switch ext {
	case ".png":
		mimeType = "image/png"
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".gif":
		mimeType = "image/gif"
	case ".webp":
		mimeType = "image/webp"
	default:
		return "", fmt.Errorf("unsupported image format: %s", ext)
	}

	// Encode to base64
	encoded := base64.StdEncoding.EncodeToString(data)

	// Return data URL
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
}

// IsBase64DataURL checks if a string is a base64 data URL
func IsBase64DataURL(url string) bool {
	return strings.HasPrefix(url, "data:image/")
}

// IsLocalFilePath checks if a URL is a local file path
func IsLocalFilePath(url string) bool {
	// Check if it's a relative path starting with /uploads
	if strings.HasPrefix(url, "/uploads/") {
		return true
	}
	// Check if it's an absolute local path
	if strings.HasPrefix(url, "./") || strings.HasPrefix(url, "../") {
		return true
	}
	return false
}

// ConvertImageURLToBase64 converts a local file path to base64 data URL
// If the URL is already a base64 data URL or remote URL, returns it as-is
func ConvertImageURLToBase64(imageURL string) (string, error) {
	// Already base64 data URL
	if IsBase64DataURL(imageURL) {
		return imageURL, nil
	}

	// Remote URL (http/https)
	if strings.HasPrefix(imageURL, "http://") || strings.HasPrefix(imageURL, "https://") {
		return imageURL, nil
	}

	// Local file path - convert to base64
	if IsLocalFilePath(imageURL) {
		// Remove leading slash for local file system
		filePath := strings.TrimPrefix(imageURL, "/")
		return ImageToBase64(filePath)
	}

	return "", fmt.Errorf("invalid image URL format: %s", imageURL)
}
