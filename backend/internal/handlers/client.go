package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/ruyxingubit/ispdown/internal/config"
	"github.com/ruyxingubit/ispdown/internal/models"
	"github.com/ruyxingubit/ispdown/internal/utils"
	"os"
)

// ListClients godoc
// @Summary      Lista todos os clientes do provedor
// @Description  Retorna uma lista de clientes. Usado também pelo painel administrativo.
// @Tags         clients
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   models.Client
// @Failure      500  {object}  map[string]string
// @Router       /admin/clients [get]
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

// CreateClient godoc
// @Summary      Cria um novo cliente
// @Description  Registra um cliente vinculando ao provedor logado.
// @Tags         clients
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        client  body      map[string]string  true  "Dados do Cliente (name, cpf, pin)"
// @Success      201     {object}  models.Client
// @Failure      400     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /admin/clients [post]
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

// UpdateClientStatus godoc
// @Summary      Ativa ou suspende um cliente
// @Description  Altera o status IsActive de um cliente (ERP pode usar para bloquear inadimplentes).
// @Tags         clients
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id      path      int  true  "ID do Cliente"
// @Param        status  body      map[string]bool  true  "Status (isActive)"
// @Success      200     {object}  map[string]string
// @Failure      400     {object}  map[string]string
// @Failure      404     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /admin/clients/{id}/status [put]
func UpdateClientStatus(c *fiber.Ctx) error {
	providerID := c.Locals("providerID").(float64)
	clientID := c.Params("id")

	type UpdateStatusReq struct {
		IsActive bool `json:"isActive"`
	}

	var req UpdateStatusReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Requisição inválida"})
	}

	var client models.Client
	if err := config.DB.Where("id = ? AND provider_id = ?", clientID, uint(providerID)).First(&client).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Cliente não encontrado"})
	}

	client.IsActive = req.IsActive
	if err := config.DB.Save(&client).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao atualizar status do cliente"})
	}

	statusMsg := "ativado"
	if !client.IsActive {
		statusMsg = "suspenso"
	}

	return c.JSON(fiber.Map{"message": "Cliente " + statusMsg + " com sucesso"})
}

// DeleteClient godoc
// @Summary      Apaga um cliente definitivamente
// @Description  Remove o cliente e também os arquivos vinculados a ele do banco e do disco. (Para casos de cancelamento no ERP).
// @Tags         clients
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id      path      int  true  "ID do Cliente"
// @Success      200     {object}  map[string]string
// @Failure      404     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /admin/clients/{id} [delete]
func DeleteClient(c *fiber.Ctx) error {
	providerID := c.Locals("providerID").(float64)
	clientID := c.Params("id")

	var client models.Client
	if err := config.DB.Where("id = ? AND provider_id = ?", clientID, uint(providerID)).First(&client).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Cliente não encontrado"})
	}

	// Remove todos os arquivos do cliente (banco e disco)
	var files []models.File
	config.DB.Where("client_id = ?", client.ID).Find(&files)
	for _, f := range files {
		if f.DiskPath != "" {
			os.Remove(f.DiskPath)
		}
		config.DB.Delete(&f)
	}

	// Remove o cliente
	if err := config.DB.Delete(&client).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao deletar cliente"})
	}

	return c.JSON(fiber.Map{"message": "Cliente e todos os seus arquivos foram apagados com sucesso"})
}
