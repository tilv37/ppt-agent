package database

import (
	"log"

	"github.com/yourusername/ppt-agent-backend/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase initializes the database connection
func InitDatabase(databaseURL string) error {
	var err error

	DB, err = gorm.Open(sqlite.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return err
	}

	// Auto migrate all models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Project{},
		&models.Presentation{},
		&models.Slide{},
		&models.ChatMessage{},
		&models.AgentTrace{},
		&models.Template{},
		&models.LayoutPattern{},
		&models.Asset{},
	)

	if err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
