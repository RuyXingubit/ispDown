package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

// HashString faz o hash de uma string usando SHA-256 (usado para senhas e PINs)
func HashString(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}
