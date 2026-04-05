package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/internal/services/layout"
)

// InstantiateDSLRequest represents the request body for DSL instantiation
type InstantiateDSLRequest struct {
	DSLJson    string                 `json:"dslJson" binding:"required"`
	Parameters map[string]interface{} `json:"parameters"`
}

// InstantiateDSLResponse represents the response for DSL instantiation
type InstantiateDSLResponse struct {
	InstantiatedDSL string `json:"instantiatedDsl"`
}

// InstantiateDSL instantiates a parameterized DSL with given parameters
func InstantiateDSL(c *gin.Context) {
	var req InstantiateDSLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body: " + err.Error(),
			},
		})
		return
	}

	// Create instantiator
	instantiator := layout.NewDSLInstantiator()

	// Instantiate DSL
	instantiatedDSL, err := instantiator.InstantiateDSL(req.DSLJson, req.Parameters)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INSTANTIATION_FAILED",
				"message": "Failed to instantiate DSL: " + err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": InstantiateDSLResponse{
			InstantiatedDSL: instantiatedDSL,
		},
	})
}
