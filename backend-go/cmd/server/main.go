package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/yourusername/ppt-agent-backend/internal/config"
	"github.com/yourusername/ppt-agent-backend/internal/database"
	"github.com/yourusername/ppt-agent-backend/internal/handlers"
	"github.com/yourusername/ppt-agent-backend/internal/middleware"
	"github.com/yourusername/ppt-agent-backend/internal/services/llm"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize LLM service
	llm.InitGlobalService()

	// Initialize database
	if err := database.InitDatabase(cfg.Database.URL); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create Gin router
	r := gin.Default()

	// Serve static files (uploads)
	r.Static("/uploads", "./"+cfg.Upload.UploadDir)

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API routes
	api := r.Group("/api/v1")
	{
		// Health check
		api.GET("/health", handlers.HealthCheck)

		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			protected.GET("/users/me", handlers.GetMe)

			// Project routes
			protected.GET("/projects", handlers.GetProjects)
			protected.POST("/projects", handlers.CreateProject)
			protected.GET("/projects/:id", handlers.GetProject)
			protected.PATCH("/projects/:id", handlers.UpdateProject)
			protected.DELETE("/projects/:id", handlers.DeleteProject)

			// Layout Pattern routes
			protected.GET("/layout-patterns", handlers.GetLayoutPatterns)
			protected.GET("/layout-patterns/:id", handlers.GetLayoutPattern)
			protected.POST("/layout-patterns", handlers.CreateLayoutPattern)
			protected.PATCH("/layout-patterns/:id", handlers.UpdateLayoutPattern)
			protected.DELETE("/layout-patterns/:id", handlers.DeleteLayoutPattern)
			protected.POST("/layout-patterns/:id/validate", handlers.ValidateLayoutPattern)

			// Upload routes
			protected.POST("/uploads/layout-image", handlers.UploadLayoutImage)

			// TODO: Add more routes
			// - Presentations
			// - Slides
			// - Templates
			// - Assets
			// - Chat
			// - Pipeline
			// - Export
		}
	}

	log.Printf("Server starting on port %s", cfg.Server.Port)
	if err := r.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
