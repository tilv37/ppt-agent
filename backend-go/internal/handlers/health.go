package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/pkg/utils"
)

// HealthCheck returns the health status of the API
func HealthCheck(c *gin.Context) {
	utils.RespondSuccess(c, 200, gin.H{
		"status": "ok",
		"service": "ppt-agent-api",
	})
}
