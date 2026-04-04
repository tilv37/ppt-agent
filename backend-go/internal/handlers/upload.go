package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/internal/config"
	"github.com/yourusername/ppt-agent-backend/pkg/utils"
)

// UploadLayoutImage handles layout reference image upload
func UploadLayoutImage(c *gin.Context) {
	cfg := config.Get()

	// Get file from form
	file, err := c.FormFile("image")
	if err != nil {
		utils.RespondError(c, 400, "INVALID_FILE", "No file uploaded")
		return
	}

	// Validate file type
	allowedTypes := make(map[string]bool)
	for _, t := range cfg.Upload.AllowedTypes {
		allowedTypes[t] = true
	}

	contentType := file.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		utils.RespondError(c, 400, "INVALID_FILE_TYPE", "Only PNG/JPG images are allowed")
		return
	}

	// Validate file size
	if file.Size > cfg.Upload.MaxFileSize {
		utils.RespondError(c, 400, "FILE_TOO_LARGE", fmt.Sprintf("File size must be less than %d MB", cfg.Upload.MaxFileSize/(1024*1024)))
		return
	}

	// Generate file path
	now := time.Now()
	dir := fmt.Sprintf("%s/layout-images/%d/%02d", cfg.Upload.UploadDir, now.Year(), now.Month())

	// Create directory if not exists
	if err := os.MkdirAll(dir, 0755); err != nil {
		utils.RespondError(c, 500, "SAVE_FAILED", "Failed to create upload directory")
		return
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%s%s", now.Unix(), utils.GenerateRandomString(6), ext)
	filePath := filepath.Join(dir, filename)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.RespondError(c, 500, "SAVE_FAILED", "Failed to save file")
		return
	}

	// Return accessible URL
	fileURL := fmt.Sprintf("/uploads/layout-images/%d/%02d/%s", now.Year(), now.Month(), filename)

	utils.RespondSuccess(c, 200, gin.H{
		"url":      fileURL,
		"filename": filename,
		"size":     file.Size,
	})
}
