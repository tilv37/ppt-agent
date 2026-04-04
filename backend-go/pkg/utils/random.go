package utils

import (
	"crypto/rand"
	"encoding/base32"
	"strings"
)

// GenerateRandomString generates a random string of specified length
func GenerateRandomString(length int) string {
	// Generate random bytes
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to timestamp-based if random fails
		return GenerateCUID()[:length]
	}

	// Encode to base32 and clean up
	encoded := base32.StdEncoding.EncodeToString(bytes)
	encoded = strings.ToLower(strings.TrimRight(encoded, "="))

	// Truncate to desired length
	if len(encoded) > length {
		return encoded[:length]
	}

	return encoded
}
