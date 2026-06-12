package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ruyxingubit/isptransfer/internal/config"
	"github.com/ruyxingubit/isptransfer/internal/models"
)

// Helper para fazer hash do PIN ou Senha (simples para este MVP)
func hashString(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

// Helper para gerar o token JWT
func generateToken(id uint, isProvider bool) (string, error) {
	cfg := config.LoadConfig()
	claims := jwt.MapClaims{
		"id":         id,
		"isProvider": isProvider,
		"exp":        time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}

func AdminLogin(c *fiber.Ctx) error {
	type LoginRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Requisição inválida"})
	}

	var provider models.Provider
	// Busca provedor
	if err := config.DB.Where("username = ?", req.Username).First(&provider).Error; err != nil {
		// Mock: Se o banco estiver vazio e for o admin inicial
		if req.Username == "admin" && req.Password == "admin" {
			provider = models.Provider{ID: 1, Username: "admin", Password: hashString("admin")}
			config.DB.Create(&provider)
		} else {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Usuário ou senha incorretos"})
		}
	}

	// Valida senha hasheada
	if provider.Password != hashString(req.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Usuário ou senha incorretos"})
	}

	token, err := generateToken(provider.ID, true)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao gerar token"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":       provider.ID,
			"username": provider.Username,
		},
	})
}

func ClientLogin(c *fiber.Ctx) error {
	type LoginRequest struct {
		CPF string `json:"cpf"`
		PIN string `json:"pin"`
	}

	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Requisição inválida"})
	}

	var client models.Client
	if err := config.DB.Where("cpf = ? AND is_active = ?", req.CPF, true).First(&client).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "CPF não cadastrado ou inativo"})
	}

	if client.PIN != hashString(req.PIN) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "PIN incorreto"})
	}

	token, err := generateToken(client.ID, false)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao gerar token"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":   client.ID,
			"name": client.Name,
			"cpf":  client.CPF,
		},
	})
}
