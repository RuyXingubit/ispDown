package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ruyxingubit/ispdown/internal/config"
	"github.com/ruyxingubit/ispdown/internal/models"
	"github.com/ruyxingubit/ispdown/internal/utils"
)

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

// AdminLogin godoc
// @Summary      Realiza login de administrador
// @Description  Retorna token JWT de acesso ao painel do provedor ou ERP.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        credentials  body      map[string]string  true  "Credenciais (username, password)"
// @Success      200          {object}  map[string]interface{}
// @Failure      400          {object}  map[string]string
// @Failure      401          {object}  map[string]string
// @Failure      500          {object}  map[string]string
// @Router       /admin/login [post]
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
			provider = models.Provider{ID: 1, Username: "admin", Password: utils.HashString("admin"), MustChangePassword: true}
			if err := config.DB.Create(&provider).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro crítico ao criar admin"})
			}
		} else {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Usuário ou senha incorretos"})
		}
	}

	// Valida senha hasheada
	if provider.Password != utils.HashString(req.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Usuário ou senha incorretos"})
	}

	token, err := generateToken(provider.ID, true)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao gerar token"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":                   provider.ID,
			"username":             provider.Username,
			"must_change_password": provider.MustChangePassword,
		},
	})
}

// ChangePassword godoc
// @Summary      Altera senha do administrador
// @Description  Troca a senha do provedor logado.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        passwords  body      map[string]string  true  "Nova senha (new_password)"
// @Success      200        {object}  map[string]string
// @Failure      400        {object}  map[string]string
// @Failure      404        {object}  map[string]string
// @Failure      500        {object}  map[string]string
// @Router       /admin/change-password [post]
func ChangePassword(c *fiber.Ctx) error {
	type ChangePasswordReq struct {
		NewPassword string `json:"new_password"`
	}

	var req ChangePasswordReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Requisição inválida"})
	}

	// O ID do provider vem do token JWT
	providerID := c.Locals("providerID").(float64)

	var provider models.Provider
	if err := config.DB.First(&provider, uint(providerID)).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Provedor não encontrado"})
	}

	provider.Password = utils.HashString(req.NewPassword)
	provider.MustChangePassword = false

	if err := config.DB.Save(&provider).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao atualizar senha"})
	}

	return c.JSON(fiber.Map{"message": "Senha atualizada com sucesso!"})
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

	if client.PIN != utils.HashString(req.PIN) {
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
