package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/ruyxingubit/ispdown/internal/config"
	"github.com/ruyxingubit/ispdown/internal/models"
	"github.com/ruyxingubit/ispdown/internal/utils"
)

func ListClients(c *fiber.Ctx) error {
	providerID := c.Locals("providerID").(float64)

	var clients []models.Client
	if err := config.DB.Where("provider_id = ?", uint(providerID)).Find(&clients).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar clientes"})
	}

	// Não retornar o PIN
	for i := range clients {
		clients[i].PIN = ""
	}

	return c.JSON(clients)
}

func CreateClient(c *fiber.Ctx) error {
	providerID := c.Locals("providerID").(float64)

	type CreateClientReq struct {
		Name string `json:"name"`
		CPF  string `json:"cpf"`
		PIN  string `json:"pin"`
	}

	var req CreateClientReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Requisição inválida"})
	}

	// Validação simples
	if req.Name == "" || req.CPF == "" || req.PIN == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nome, CPF e PIN são obrigatórios"})
	}

	client := models.Client{
		ProviderID: uint(providerID),
		Name:       req.Name,
		CPF:        req.CPF,
		PIN:        utils.HashString(req.PIN),
		IsActive:   true,
	}

	if err := config.DB.Create(&client).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar cliente (CPF pode já existir)"})
	}

	client.PIN = "" // Ocultar o hash do PIN na resposta
	return c.Status(fiber.StatusCreated).JSON(client)
}
