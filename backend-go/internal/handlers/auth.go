package handlers

import (
	"net/mail"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/internal/database"
	"github.com/yourusername/ppt-agent-backend/internal/middleware"
	"github.com/yourusername/ppt-agent-backend/internal/models"
	"github.com/yourusername/ppt-agent-backend/pkg/utils"
)

type RegisterRequest struct {
	Email    string  `json:"email" binding:"required"`
	Password string  `json:"password" binding:"required,min=6"`
	Name     *string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User  UserInfo `json:"user"`
	Token string   `json:"token"`
}

type UserInfo struct {
	ID    string  `json:"id"`
	Email string  `json:"email"`
	Name  *string `json:"name"`
}

// Register handles user registration
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}

	// Validate email format
	if _, err := mail.ParseAddress(req.Email); err != nil {
		utils.RespondError(c, 400, "INVALID_EMAIL", "Invalid email format")
		return
	}

	db := database.GetDB()

	// Check if user exists
	var existingUser models.User
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.RespondError(c, 409, "USER_EXISTS", "User with this email already exists")
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to hash password")
		return
	}

	// Create user
	user := models.User{
		ID:       utils.GenerateCUID(),
		Email:    req.Email,
		Name:     req.Name,
		Password: hashedPassword,
	}

	if err := db.Create(&user).Error; err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to create user")
		return
	}

	// Create session
	sessionID := utils.GenerateCUID()
	token, err := utils.GenerateToken(user.ID, sessionID)
	if err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to generate token")
		return
	}

	session := models.Session{
		ID:        sessionID,
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	if err := db.Create(&session).Error; err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to create session")
		return
	}

	utils.RespondSuccess(c, 201, AuthResponse{
		User: UserInfo{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
		Token: token,
	})
}

// Login handles user login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}

	db := database.GetDB()

	// Find user
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.RespondError(c, 401, "INVALID_CREDENTIALS", "Invalid email or password")
		return
	}

	// Verify password
	if !utils.VerifyPassword(req.Password, user.Password) {
		utils.RespondError(c, 401, "INVALID_CREDENTIALS", "Invalid email or password")
		return
	}

	// Create session
	sessionID := utils.GenerateCUID()
	token, err := utils.GenerateToken(user.ID, sessionID)
	if err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to generate token")
		return
	}

	session := models.Session{
		ID:        sessionID,
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	if err := db.Create(&session).Error; err != nil {
		utils.RespondError(c, 500, "INTERNAL_ERROR", "Failed to create session")
		return
	}

	utils.RespondSuccess(c, 200, AuthResponse{
		User: UserInfo{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
		Token: token,
	})
}

// Logout handles user logout
func Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		utils.RespondSuccess(c, 200, gin.H{"message": "Logged out successfully"})
		return
	}

	tokenString := authHeader[7:] // Remove "Bearer "

	db := database.GetDB()
	db.Where("token = ?", tokenString).Delete(&models.Session{})

	utils.RespondSuccess(c, 200, gin.H{"message": "Logged out successfully"})
}

// GetMe returns current user info
func GetMe(c *gin.Context) {
	userID := middleware.GetUserID(c)

	db := database.GetDB()
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		utils.RespondError(c, 404, "USER_NOT_FOUND", "User not found")
		return
	}

	utils.RespondSuccess(c, 200, UserInfo{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
	})
}
