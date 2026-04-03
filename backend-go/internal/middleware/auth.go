package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/pkg/utils"
)

// AuthMiddleware validates JWT token and sets user context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			utils.RespondError(c, 401, "UNAUTHORIZED", "Missing or invalid authorization header")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims, err := utils.VerifyToken(tokenString)
		if err != nil {
			utils.RespondError(c, 401, "INVALID_TOKEN", "Invalid or expired token")
			c.Abort()
			return
		}

		// Set user context
		c.Set("userId", claims.UserID)
		c.Set("sessionId", claims.SessionID)

		c.Next()
	}
}

// GetUserID retrieves user ID from context
func GetUserID(c *gin.Context) string {
	userID, exists := c.Get("userId")
	if !exists {
		return ""
	}
	return userID.(string)
}
