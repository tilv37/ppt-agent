package utils

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"strings"
	"time"
)

// GenerateCUID generates a CUID-like identifier
// Format: c + timestamp + counter + random
func GenerateCUID() string {
	// Timestamp (base36)
	timestamp := time.Now().UnixMilli()

	// Random bytes
	randomBytes := make([]byte, 8)
	rand.Read(randomBytes)

	// Encode to base32 and clean up
	encoded := base32.StdEncoding.EncodeToString(randomBytes)
	encoded = strings.ToLower(strings.TrimRight(encoded, "="))

	// Format: c + timestamp + random (truncated to ~25 chars)
	cuid := fmt.Sprintf("c%x%s", timestamp, encoded)

	// Truncate to reasonable length
	if len(cuid) > 30 {
		cuid = cuid[:30]
	}

	return cuid
}
