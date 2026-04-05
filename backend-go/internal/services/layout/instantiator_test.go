package layout

import (
	"encoding/json"
	"testing"
)

func TestInstantiateDSL_BasicParameterReplacement(t *testing.T) {
	instantiator := NewDSLInstantiator()

	// Parameterized DSL with simple parameter references
	dslJson := `{
		"layoutId": "test-layout",
		"name": "Test Layout",
		"category": "content",
		"description": "Test parameterized layout",
		"canvas": {"width": 1920, "height": 1080},
		"parameters": {
			"columnCount": {
				"type": "integer",
				"default": 3,
				"min": 2,
				"max": 6
			}
		},
		"regions": [
			{
				"id": "container",
				"type": "container",
				"bounds": {"x": 60, "y": 60, "width": 1800, "height": 900},
				"gridConfig": {
					"columns": "{$columnCount}",
					"gap": 40
				}
			}
		]
	}`

	// Instantiate with custom parameters
	params := map[string]interface{}{
		"columnCount": 4,
	}

	result, err := instantiator.InstantiateDSL(dslJson, params)
	if err != nil {
		t.Fatalf("InstantiateDSL failed: %v", err)
	}

	// Parse result
	var resultMap map[string]interface{}
	if err := json.Unmarshal([]byte(result), &resultMap); err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	// Verify parameters field is removed
	if _, exists := resultMap["parameters"]; exists {
		t.Error("Parameters field should be removed after instantiation")
	}

	// Verify parameter replacement
	regions := resultMap["regions"].([]interface{})
	region := regions[0].(map[string]interface{})
	gridConfig := region["gridConfig"].(map[string]interface{})

	columns := gridConfig["columns"]
	if columnsFloat, ok := columns.(float64); ok {
		if int(columnsFloat) != 4 {
			t.Errorf("Expected columns to be 4, got %v", columns)
		}
	} else {
		t.Errorf("Expected columns to be a number, got %T", columns)
	}
}

func TestInstantiateDSL_DefaultParameters(t *testing.T) {
	instantiator := NewDSLInstantiator()

	dslJson := `{
		"layoutId": "test-layout",
		"name": "Test Layout",
		"category": "content",
		"canvas": {"width": 1920, "height": 1080},
		"parameters": {
			"columnCount": {
				"type": "integer",
				"default": 3
			}
		},
		"regions": [
			{
				"id": "container",
				"type": "container",
				"bounds": {"x": 60, "y": 60, "width": 1800, "height": 900},
				"gridConfig": {
					"columns": "{$columnCount}"
				}
			}
		]
	}`

	// Instantiate without providing parameters (should use defaults)
	result, err := instantiator.InstantiateDSL(dslJson, map[string]interface{}{})
	if err != nil {
		t.Fatalf("InstantiateDSL failed: %v", err)
	}

	var resultMap map[string]interface{}
	if err := json.Unmarshal([]byte(result), &resultMap); err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	regions := resultMap["regions"].([]interface{})
	region := regions[0].(map[string]interface{})
	gridConfig := region["gridConfig"].(map[string]interface{})

	columns := gridConfig["columns"]
	if columnsFloat, ok := columns.(float64); ok {
		if int(columnsFloat) != 3 {
			t.Errorf("Expected default columns to be 3, got %v", columns)
		}
	} else {
		t.Errorf("Expected columns to be a number, got %T", columns)
	}
}

func TestInstantiateDSL_RepeatExpansion(t *testing.T) {
	instantiator := NewDSLInstantiator()

	dslJson := `{
		"layoutId": "multi-column",
		"name": "Multi Column Layout",
		"category": "content",
		"canvas": {"width": 1920, "height": 1080},
		"parameters": {
			"columnCount": {
				"type": "integer",
				"default": 3
			}
		},
		"regions": [
			{
				"id": "columns-container",
				"type": "container",
				"bounds": {"x": 60, "y": 60, "width": 1800, "height": 900},
				"slots": [
					{
						"id": "column-{i}",
						"type": "text",
						"repeat": "{$columnCount}"
					}
				]
			}
		]
	}`

	params := map[string]interface{}{
		"columnCount": 4,
	}

	result, err := instantiator.InstantiateDSL(dslJson, params)
	if err != nil {
		t.Fatalf("InstantiateDSL failed: %v", err)
	}

	var resultMap map[string]interface{}
	if err := json.Unmarshal([]byte(result), &resultMap); err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	regions := resultMap["regions"].([]interface{})
	region := regions[0].(map[string]interface{})
	slots := region["slots"].([]interface{})

	// Should have 4 slots (expanded from repeat)
	if len(slots) != 4 {
		t.Errorf("Expected 4 slots after expansion, got %d", len(slots))
	}

	// Verify each slot has correct index
	for i, slot := range slots {
		slotMap := slot.(map[string]interface{})
		expectedID := "column-" + string(rune('0'+i))
		if slotMap["id"] != expectedID {
			t.Errorf("Expected slot %d to have id %s, got %v", i, expectedID, slotMap["id"])
		}

		// Verify repeat field is removed
		if _, hasRepeat := slotMap["repeat"]; hasRepeat {
			t.Error("Repeat field should be removed after expansion")
		}
	}
}

func TestInstantiateDSL_ArrayParameter(t *testing.T) {
	instantiator := NewDSLInstantiator()

	dslJson := `{
		"layoutId": "test-layout",
		"name": "Test Layout",
		"category": "content",
		"canvas": {"width": 1920, "height": 1080},
		"parameters": {
			"columnRatio": {
				"type": "array",
				"default": [1, 2, 1]
			}
		},
		"regions": [
			{
				"id": "container",
				"type": "container",
				"bounds": {"x": 60, "y": 60, "width": 1800, "height": 900},
				"gridConfig": {
					"columns": 3,
					"columnRatio": "{$columnRatio}"
				}
			}
		]
	}`

	params := map[string]interface{}{
		"columnRatio": []interface{}{3, 5, 2},
	}

	result, err := instantiator.InstantiateDSL(dslJson, params)
	if err != nil {
		t.Fatalf("InstantiateDSL failed: %v", err)
	}

	var resultMap map[string]interface{}
	if err := json.Unmarshal([]byte(result), &resultMap); err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	regions := resultMap["regions"].([]interface{})
	region := regions[0].(map[string]interface{})
	gridConfig := region["gridConfig"].(map[string]interface{})

	columnRatio := gridConfig["columnRatio"].([]interface{})
	if len(columnRatio) != 3 {
		t.Errorf("Expected columnRatio to have 3 elements, got %d", len(columnRatio))
	}

	expected := []float64{3, 5, 2}
	for i, val := range columnRatio {
		if valFloat, ok := val.(float64); ok {
			if int(valFloat) != int(expected[i]) {
				t.Errorf("Expected columnRatio[%d] to be %v, got %v", i, expected[i], val)
			}
		}
	}
}

func TestInstantiateDSL_ComplexScenario(t *testing.T) {
	instantiator := NewDSLInstantiator()

	// Complex DSL with multiple parameters and repeat
	dslJson := `{
		"layoutId": "complex-layout",
		"name": "Complex Layout",
		"category": "content",
		"canvas": {"width": 1920, "height": 1080},
		"parameters": {
			"columnCount": {
				"type": "integer",
				"default": 3,
				"min": 2,
				"max": 6
			},
			"itemsPerColumn": {
				"type": "integer",
				"default": 5
			},
			"contentType": {
				"type": "enum",
				"default": "text",
				"options": ["text", "image", "mixed"]
			}
		},
		"regions": [
			{
				"id": "header",
				"type": "text",
				"bounds": {"x": 60, "y": 60, "width": 1800, "height": 100}
			},
			{
				"id": "columns-container",
				"type": "container",
				"bounds": {"x": 60, "y": 180, "width": 1800, "height": 800},
				"gridConfig": {
					"columns": "{$columnCount}",
					"gap": 40
				},
				"slots": [
					{
						"id": "column-{i}",
						"type": "{$contentType}",
						"repeat": "{$columnCount}",
						"constraints": {
							"maxItems": "{$itemsPerColumn}"
						}
					}
				]
			}
		]
	}`

	params := map[string]interface{}{
		"columnCount":    4,
		"itemsPerColumn": 6,
		"contentType":    "mixed",
	}

	result, err := instantiator.InstantiateDSL(dslJson, params)
	if err != nil {
		t.Fatalf("InstantiateDSL failed: %v", err)
	}

	var resultMap map[string]interface{}
	if err := json.Unmarshal([]byte(result), &resultMap); err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	// Verify parameters are removed
	if _, exists := resultMap["parameters"]; exists {
		t.Error("Parameters field should be removed")
	}

	// Verify regions
	regions := resultMap["regions"].([]interface{})
	if len(regions) != 2 {
		t.Errorf("Expected 2 regions, got %d", len(regions))
	}

	// Verify columns container
	columnsContainer := regions[1].(map[string]interface{})
	gridConfig := columnsContainer["gridConfig"].(map[string]interface{})

	if int(gridConfig["columns"].(float64)) != 4 {
		t.Errorf("Expected 4 columns, got %v", gridConfig["columns"])
	}

	// Verify slots expansion
	slots := columnsContainer["slots"].([]interface{})
	if len(slots) != 4 {
		t.Errorf("Expected 4 slots, got %d", len(slots))
	}

	// Verify each slot
	for i, slot := range slots {
		slotMap := slot.(map[string]interface{})

		// Check type replacement
		if slotMap["type"] != "mixed" {
			t.Errorf("Expected slot type to be 'mixed', got %v", slotMap["type"])
		}

		// Check constraints
		constraints := slotMap["constraints"].(map[string]interface{})
		if int(constraints["maxItems"].(float64)) != 6 {
			t.Errorf("Expected maxItems to be 6, got %v", constraints["maxItems"])
		}

		// Check ID has index
		expectedID := "column-" + string(rune('0'+i))
		if slotMap["id"] != expectedID {
			t.Errorf("Expected slot %d to have id %s, got %v", i, expectedID, slotMap["id"])
		}
	}
}
