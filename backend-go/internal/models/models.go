package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID        string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Name      *string        `json:"name"`
	Password  string         `gorm:"not null" json:"-"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Sessions []Session `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Projects []Project `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

// Session represents a user session
type Session struct {
	ID        string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	UserID    string    `gorm:"not null;index" json:"userId"`
	Token     string    `gorm:"uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

// Project represents a presentation project
type Project struct {
	ID          string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	UserID      string         `gorm:"not null;index" json:"userId"`
	Name        string         `gorm:"not null" json:"name"`
	Description *string        `json:"description"`
	Status      string         `gorm:"default:'idle'" json:"status"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	User          User            `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Presentations []Presentation  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"presentations,omitempty"`
	ChatMessages  []ChatMessage   `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
	AgentTraces   []AgentTrace    `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
}

// Presentation represents a slide deck
type Presentation struct {
	ID        string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	ProjectID string         `gorm:"not null;index" json:"projectId"`
	Title     string         `gorm:"default:'Untitled Presentation'" json:"title"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Project Project `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
	Slides  []Slide `gorm:"foreignKey:PresentationID;constraint:OnDelete:CASCADE" json:"slides,omitempty"`
}

// Slide represents a single slide
type Slide struct {
	ID             string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	PresentationID string         `gorm:"not null;index" json:"presentationId"`
	Index          int            `gorm:"not null" json:"index"`
	TemplateID     *string        `json:"templateId"`
	GeneratedSvg   *string        `gorm:"type:text" json:"generatedSvg"`
	ContentJson    *string        `gorm:"type:text" json:"contentJson"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	Presentation Presentation `gorm:"foreignKey:PresentationID;constraint:OnDelete:CASCADE" json:"-"`
}

// ChatMessage represents a chat message in a project
type ChatMessage struct {
	ID        string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	ProjectID string    `gorm:"not null;index" json:"projectId"`
	Role      string    `gorm:"not null" json:"role"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"createdAt"`

	Project Project `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
}

// AgentTrace represents an agent execution trace
type AgentTrace struct {
	ID        string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	ProjectID string    `gorm:"not null;index" json:"projectId"`
	Agent     string    `gorm:"not null" json:"agent"`
	Status    string    `gorm:"not null" json:"status"`
	Reasoning *string   `gorm:"type:text" json:"reasoning"`
	Result    *string   `gorm:"type:text" json:"result"`
	CreatedAt time.Time `json:"createdAt"`

	Project Project `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
}

// Template represents a slide template
type Template struct {
	ID         string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	Name       string         `gorm:"uniqueIndex;not null" json:"name"`
	Category   string         `gorm:"not null" json:"category"`
	SvgContent string         `gorm:"type:text;not null" json:"svgContent"`
	SchemaJson string         `gorm:"type:text;not null" json:"schemaJson"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// LayoutPattern represents a layout pattern (for template management)
type LayoutPattern struct {
	ID          string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description"`
	ImageURL    *string        `json:"imageUrl"`
	PatternJson string         `gorm:"type:text;not null" json:"patternJson"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// Asset represents an extracted asset from PPT files
type Asset struct {
	ID          string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Type        string         `gorm:"not null" json:"type"` // icon, illustration, chart, decoration
	Category    *string        `json:"category"`
	Tags        *string        `gorm:"type:text" json:"tags"` // JSON array
	FileURL     string         `gorm:"not null" json:"fileUrl"`
	ThumbnailURL *string       `json:"thumbnailUrl"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
