package middleware

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ruyxingubit/ispdown/internal/config"
)

// AdminAuth middleware para proteger rotas do provedor
func AdminAuth(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token ausente ou inválido"})
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	cfg := config.LoadConfig()
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inesperado: %v", t.Header["alg"])
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido ou expirado"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido"})
	}

	isProvider, ok := claims["isProvider"].(bool)
	if !ok || !isProvider {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Acesso negado. Apenas provedores permitidos."})
	}

	c.Locals("providerID", claims["id"])
	return c.Next()
}
