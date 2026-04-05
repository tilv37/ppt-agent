package models

// LayoutDSL represents the complete structure of a parameterized layout DSL
type LayoutDSL struct {
	LayoutID    string                 `json:"layoutId"`
	Name        string                 `json:"name"`
	Category    string                 `json:"category"`
	Description string                 `json:"description"`
	Canvas      Canvas                 `json:"canvas"`
	Parameters  map[string]Parameter   `json:"parameters,omitempty"`
	Regions     []Region               `json:"regions"`
	Styles      map[string]interface{} `json:"styles,omitempty"`
}

// Parameter defines a parameterizable value in the DSL
type Parameter struct {
	Type        string      `json:"type"` // integer, float, array, enum, boolean
	Default     interface{} `json:"default"`
	Min         *float64    `json:"min,omitempty"`
	Max         *float64    `json:"max,omitempty"`
	Options     []string    `json:"options,omitempty"` // for enum type
	Description string      `json:"description,omitempty"`
}

// Canvas defines the slide dimensions
type Canvas struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// Region defines a layout region on the slide
type Region struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Bounds      Bounds                 `json:"bounds"`
	Layout      string                 `json:"layout,omitempty"`      // grid, flex
	GridConfig  *GridConfig            `json:"gridConfig,omitempty"`  // for grid layout
	Slots       []Slot                 `json:"slots,omitempty"`       // child elements
	Constraints map[string]interface{} `json:"constraints,omitempty"` // type-specific constraints
}

// GridConfig defines grid layout configuration
type GridConfig struct {
	Columns     interface{} `json:"columns"`               // int or "{$columnCount}"
	ColumnRatio interface{} `json:"columnRatio,omitempty"` // array or "{$columnRatio}"
	Gap         int         `json:"gap,omitempty"`
}

// Slot defines a content slot within a region
type Slot struct {
	ID          string                 `json:"id"`
	Type        interface{}            `json:"type"`                  // string or "{$contentType}"
	Repeat      interface{}            `json:"repeat,omitempty"`      // int or "{$columnCount}"
	Constraints map[string]interface{} `json:"constraints,omitempty"` // slot-specific constraints
}

// Bounds defines the position and size of a region
type Bounds struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}
