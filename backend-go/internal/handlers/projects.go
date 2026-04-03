package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/internal/database"
	"github.com/yourusername/ppt-agent-backend/internal/middleware"
	"github.com/yourusername/ppt-agent-backend/internal/models"
	"github.com/yourusername/ppt-agent-backend/pkg/utils"
)

type CreateProjectRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
}

type UpdateProjectRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
}

// GetProjects returns all projects for the authenticated user
func GetProjects(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	db := database.GetDB()

	// Count total
	var total int64
	db.Model(&models.Project{}).Where("user_id = ?", userID).Count(&total)

	// Fetch projects with relations
	var projects []models.Project
	err := db.Where("user_id = ?", userID).
		Order("updated_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Preload("Presentations.Slides").
		Find(&projects).Error

	if err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to fetch projects")
		return
	}

	utils.RespondPaginated(c, projects, page, pageSize, total)
}

// GetProject returns a single project by ID
func GetProject(c *gin.Context) {
	userID := middleware.GetUserID(c)
	projectID := c.Param("id")

	db := database.GetDB()

	var project models.Project
	err := db.Where("id = ? AND user_id = ?", projectID, userID).
		Preload("Presentations.Slides").
		First(&project).Error

	if err != nil {
		utils.RespondError(c, 404, "PROJECT_NOT_FOUND", "Project not found")
		return
	}

	utils.RespondSuccess(c, 200, project)
}

// CreateProject creates a new project
func CreateProject(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}

	db := database.GetDB()

	project := models.Project{
		ID:          utils.GenerateCUID(),
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Status:      "idle",
	}

	if err := db.Create(&project).Error; err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to create project")
		return
	}

	// Reload with relations
	db.Preload("Presentations").First(&project, "id = ?", project.ID)

	utils.RespondSuccess(c, 201, project)
}

// UpdateProject updates a project
func UpdateProject(c *gin.Context) {
	userID := middleware.GetUserID(c)
	projectID := c.Param("id")

	var req UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}

	db := database.GetDB()

	var project models.Project
	if err := db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		utils.RespondError(c, 404, "PROJECT_NOT_FOUND", "Project not found")
		return
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if err := db.Model(&project).Updates(updates).Error; err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to update project")
		return
	}

	// Reload
	db.Preload("Presentations").First(&project, "id = ?", project.ID)

	utils.RespondSuccess(c, 200, project)
}

// DeleteProject deletes a project
func DeleteProject(c *gin.Context) {
	userID := middleware.GetUserID(c)
	projectID := c.Param("id")

	db := database.GetDB()

	var project models.Project
	if err := db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		utils.RespondError(c, 404, "PROJECT_NOT_FOUND", "Project not found")
		return
	}

	if err := db.Delete(&project).Error; err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to delete project")
		return
	}

	utils.RespondSuccess(c, 200, gin.H{"message": "Project deleted successfully"})
}
