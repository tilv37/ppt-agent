package layout

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// DSLInstantiator handles the instantiation of parameterized DSL templates
type DSLInstantiator struct{}

// NewDSLInstantiator creates a new DSL instantiator
func NewDSLInstantiator() *DSLInstantiator {
	return &DSLInstantiator{}
}

// InstantiateDSL converts a parameterized DSL template into a concrete DSL instance
// by replacing parameter references with actual values
func (inst *DSLInstantiator) InstantiateDSL(
	dslJson string,
	params map[string]interface{},
) (string, error) {
	// 1. Parse DSL JSON
	var dsl map[string]interface{}
	if err := json.Unmarshal([]byte(dslJson), &dsl); err != nil {
		return "", fmt.Errorf("failed to parse DSL JSON: %w", err)
	}

	// 2. Merge parameters (user-provided + defaults)
	finalParams := inst.mergeParameters(dsl, params)

	// 3. Replace parameter references
	instantiated := inst.replaceParameters(dsl, finalParams)

	// 4. Expand repeat directives
	instantiated = inst.expandRepeats(instantiated, finalParams)

	// 5. Remove parameters field (no longer needed after instantiation)
	if instantiatedMap, ok := instantiated.(map[string]interface{}); ok {
		delete(instantiatedMap, "parameters")
		instantiated = instantiatedMap
	}

	// 6. Serialize back to JSON
	result, err := json.MarshalIndent(instantiated, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to serialize instantiated DSL: %w", err)
	}

	return string(result), nil
}

// mergeParameters merges default parameters from DSL with user-provided parameters
func (inst *DSLInstantiator) mergeParameters(
	dsl map[string]interface{},
	userParams map[string]interface{},
) map[string]interface{} {
	result := make(map[string]interface{})

	// Extract default parameters from DSL
	if parameters, ok := dsl["parameters"].(map[string]interface{}); ok {
		for key, paramDef := range parameters {
			if def, ok := paramDef.(map[string]interface{}); ok {
				if defaultVal, exists := def["default"]; exists {
					result[key] = defaultVal
				}
			}
		}
	}

	// Override with user-provided parameters
	for key, val := range userParams {
		result[key] = val
	}

	return result
}

// replaceParameters recursively replaces {$paramName} references in the DSL
func (inst *DSLInstantiator) replaceParameters(
	obj interface{},
	params map[string]interface{},
) interface{} {
	switch v := obj.(type) {
	case string:
		return inst.replaceStringParams(v, params)
	case map[string]interface{}:
		result := make(map[string]interface{})
		for key, val := range v {
			result[key] = inst.replaceParameters(val, params)
		}
		return result
	case []interface{}:
		result := make([]interface{}, len(v))
		for i, val := range v {
			result[i] = inst.replaceParameters(val, params)
		}
		return result
	default:
		return v
	}
}

// replaceStringParams replaces parameter references in a string
func (inst *DSLInstantiator) replaceStringParams(
	str string,
	params map[string]interface{},
) interface{} {
	// Match {$paramName}
	re := regexp.MustCompile(`\{\$(\w+)\}`)

	// If the entire string is a parameter reference, return the parameter value (preserving type)
	if matches := re.FindStringSubmatch(str); len(matches) == 2 && matches[0] == str {
		paramName := matches[1]
		if val, ok := params[paramName]; ok {
			return val
		}
	}

	// Otherwise, perform string replacement
	return re.ReplaceAllStringFunc(str, func(match string) string {
		paramName := strings.Trim(match, "{$}")
		if val, ok := params[paramName]; ok {
			return fmt.Sprintf("%v", val)
		}
		return match
	})
}

// expandRepeats expands repeat directives in slots
func (inst *DSLInstantiator) expandRepeats(
	obj interface{},
	params map[string]interface{},
) interface{} {
	switch v := obj.(type) {
	case map[string]interface{}:
		// Check if there are slots to expand
		if slots, ok := v["slots"].([]interface{}); ok {
			expandedSlots := []interface{}{}
			for _, slot := range slots {
				if slotMap, ok := slot.(map[string]interface{}); ok {
					if repeat, hasRepeat := slotMap["repeat"]; hasRepeat {
						// Get repeat count
						repeatCount := inst.getRepeatCount(repeat, params)
						// Generate multiple copies
						for i := 0; i < repeatCount; i++ {
							copy := inst.cloneAndReplace(slotMap, i)
							delete(copy, "repeat") // Remove repeat field
							expandedSlots = append(expandedSlots, copy)
						}
					} else {
						expandedSlots = append(expandedSlots, slotMap)
					}
				}
			}
			v["slots"] = expandedSlots
		}

		// Recursively process child objects
		for key, val := range v {
			v[key] = inst.expandRepeats(val, params)
		}
		return v

	case []interface{}:
		for i, val := range v {
			v[i] = inst.expandRepeats(val, params)
		}
		return v

	default:
		return v
	}
}

// getRepeatCount extracts the repeat count from a repeat value
func (inst *DSLInstantiator) getRepeatCount(
	repeat interface{},
	params map[string]interface{},
) int {
	switch v := repeat.(type) {
	case int:
		return v
	case float64:
		return int(v)
	case string:
		// Parse {$paramName}
		if val := inst.replaceStringParams(v, params); val != v {
			if count, ok := val.(int); ok {
				return count
			}
			if count, ok := val.(float64); ok {
				return int(count)
			}
		}
	}
	return 1
}

// cloneAndReplace creates a deep copy of an object and replaces {i} with the index
func (inst *DSLInstantiator) cloneAndReplace(
	obj map[string]interface{},
	index int,
) map[string]interface{} {
	result := make(map[string]interface{})
	for key, val := range obj {
		result[key] = inst.replaceIndex(val, index)
	}
	return result
}

// replaceIndex recursively replaces {i} with the given index
func (inst *DSLInstantiator) replaceIndex(obj interface{}, index int) interface{} {
	switch v := obj.(type) {
	case string:
		return strings.ReplaceAll(v, "{i}", fmt.Sprintf("%d", index))
	case map[string]interface{}:
		result := make(map[string]interface{})
		for key, val := range v {
			result[key] = inst.replaceIndex(val, index)
		}
		return result
	case []interface{}:
		result := make([]interface{}, len(v))
		for i, val := range v {
			result[i] = inst.replaceIndex(val, index)
		}
		return result
	default:
		return v
	}
}
