package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/internal/database"
	"github.com/yourusername/ppt-agent-backend/internal/models"
	"github.com/yourusername/ppt-agent-backend/internal/services/llm"
	"github.com/yourusername/ppt-agent-backend/pkg/utils"
)

// CreateLayoutPatternRequest represents the request to create a layout pattern
type CreateLayoutPatternRequest struct {
	Mode        string  `json:"mode" binding:"required,oneof=ai manual"`
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	Category    string  `json:"category" binding:"required,oneof=content cover section conclusion"`

	// AI mode fields
	ImageURL   *string `json:"imageUrl"`
	UserPrompt *string `json:"userPrompt"`

	// Manual mode fields
	PatternJson *string `json:"patternJson"`
}

// UpdateLayoutPatternRequest represents the request to update a layout pattern
type UpdateLayoutPatternRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Category    *string `json:"category"`
	PatternJson *string `json:"patternJson"`
}

// ValidateLayoutPatternRequest represents the request to validate a layout pattern
type ValidateLayoutPatternRequest struct {
	PatternJson  string  `json:"patternJson" binding:"required"`
	UserFeedback *string `json:"userFeedback"`
}

// GetLayoutPatterns returns all layout patterns with optional category filter
func GetLayoutPatterns(c *gin.Context) {
	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Parse category filter
	category := c.Query("category")

	db := database.GetDB()

	// Build query
	query := db.Model(&models.LayoutPattern{})
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// Count total
	var total int64
	query.Count(&total)

	// Fetch patterns
	var patterns []models.LayoutPattern
	err := query.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&patterns).Error

	if err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to fetch layout patterns")
		return
	}

	utils.RespondPaginated(c, patterns, page, pageSize, total)
}

// GetLayoutPattern returns a single layout pattern by ID
func GetLayoutPattern(c *gin.Context) {
	patternID := c.Param("id")

	db := database.GetDB()

	var pattern models.LayoutPattern
	if err := db.First(&pattern, "id = ?", patternID).Error; err != nil {
		utils.RespondError(c, 404, "PATTERN_NOT_FOUND", "Layout pattern not found")
		return
	}

	utils.RespondSuccess(c, 200, pattern)
}

// CreateLayoutPattern creates a new layout pattern
func CreateLayoutPattern(c *gin.Context) {
	var req CreateLayoutPatternRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}

	db := database.GetDB()
	llmService := llm.GetLayoutService()

	var patternJson string
	var err error

	if req.Mode == "ai" {
		// AI generation mode
		if req.ImageURL == nil || req.UserPrompt == nil {
			utils.RespondError(c, 400, "MISSING_FIELDS", "imageUrl and userPrompt are required for AI mode")
			return
		}

		// Generate DSL using LLM
		patternJson, err = llmService.GenerateDSL(*req.ImageURL, *req.UserPrompt, req.Category)
		if err != nil {
			utils.RespondError(c, 500, "AI_GENERATION_FAILED", err.Error())
			return
		}
	} else {
		// Manual mode
		if req.PatternJson == nil {
			utils.RespondError(c, 400, "MISSING_FIELDS", "patternJson is required for manual mode")
			return
		}
		patternJson = *req.PatternJson
	}

	// Create pattern record
	pattern := models.LayoutPattern{
		ID:          utils.GenerateCUID(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		ImageURL:    req.ImageURL,
		PatternJson: patternJson,
		CreatedBy:   req.Mode,
		Version:     1,
	}

	if err := db.Create(&pattern).Error; err != nil {
		utils.RespondError(c, 500, "CREATE_FAILED", "Failed to create layout pattern")
		return
	}

	utils.RespondSuccess(c, 201, pattern)
}

// UpdateLayoutPattern updates a layout pattern
func UpdateLayoutPattern(c *gin.Context) {
	patternID := c.Param("id")

	var req UpdateLayoutPatternRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}

	db := database.GetDB()

	var pattern models.LayoutPattern
	if err := db.First(&pattern, "id = ?", patternID).Error; err != nil {
		utils.RespondError(c, 404, "PATTERN_NOT_FOUND", "Layout pattern not found")
		return
	}

	// Build updates map
	updates := make(map[string]any)
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.PatternJson != nil {
		updates["pattern_json"] = *req.PatternJson
		updates["version"] = pattern.Version + 1
	}

	if err := db.Model(&pattern).Updates(updates).Error; err != nil {
		utils.RespondError(c, 500, "UPDATE_FAILED", "Failed to update layout pattern")
		return
	}

	// Reload pattern
	db.First(&pattern, "id = ?", patternID)

	utils.RespondSuccess(c, 200, pattern)
}

// DeleteLayoutPattern deletes a layout pattern
func DeleteLayoutPattern(c *gin.Context) {
	patternID := c.Param("id")

	db := database.GetDB()

	var pattern models.LayoutPattern
	if err := db.First(&pattern, "id = ?", patternID).Error; err != nil {
		utils.RespondError(c, 404, "PATTERN_NOT_FOUND", "Layout pattern not found")
		return
	}

	if err := db.Delete(&pattern).Error; err != nil {
		utils.RespondError(c, 500, "DELETE_FAILED", "Failed to delete layout pattern")
		return
	}

	utils.RespondSuccess(c, 200, gin.H{"message": "Layout pattern deleted successfully"})
}

// ValidateLayoutPattern validates and corrects a layout pattern
func ValidateLayoutPattern(c *gin.Context) {
	patternID := c.Param("id")

	var req ValidateLayoutPatternRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}

	llmService := llm.GetLayoutService()

	// Validate DSL
	result, err := llmService.ValidateDSL(req.PatternJson, req.UserFeedback)
	if err != nil {
		utils.RespondError(c, 500, "VALIDATION_FAILED", err.Error())
		return
	}

	// If user provided feedback, also correct the DSL
	if req.UserFeedback != nil && *req.UserFeedback != "" {
		correctedDSL, err := llmService.CorrectDSL(req.PatternJson, *req.UserFeedback)
		if err == nil {
			result.CorrectedDSL = correctedDSL
		}
	}

	// Optionally update database if valid
	if result.Valid && patternID != "" {
		db := database.GetDB()
		var pattern models.LayoutPattern
		if err := db.First(&pattern, "id = ?", patternID).Error; err == nil {
			db.Model(&pattern).Updates(map[string]any{
				"pattern_json": result.CorrectedDSL,
				"version":      pattern.Version + 1,
			})
		}
	}

	utils.RespondSuccess(c, 200, result)
}
