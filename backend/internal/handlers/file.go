package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ruyxingubit/ispdown/internal/config"
	"github.com/ruyxingubit/ispdown/internal/models"
)

// --- FILE HANDLERS ---

func UploadChunk(c *fiber.Ctx) error {
	clientID := c.Locals("clientID").(float64)

	// Pegar os dados do chunk
	fileIdentifier := c.FormValue("fileIdentifier") // Ex: "uuid-do-frontend"
	chunkIndex := c.FormValue("chunkIndex")
	
	fileHeader, err := c.FormFile("chunk")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Chunk não enviado"})
	}

	// Definir pasta e arquivo temporário para montagem
	cfg := config.LoadConfig()
	tempDir := filepath.Join(cfg.UploadDir, "tmp", fmt.Sprintf("%d_%s", int(clientID), fileIdentifier))
	
	// Cria pasta tmp se não existir
	os.MkdirAll(tempDir, os.ModePerm)

	// Salva o chunk recebido (nome = index)
	chunkPath := filepath.Join(tempDir, chunkIndex)
	if err := c.SaveFile(fileHeader, chunkPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Falha ao salvar chunk no disco"})
	}

	return c.JSON(fiber.Map{"message": "Chunk recebido"})
}

func UploadComplete(c *fiber.Ctx) error {
	clientID := c.Locals("clientID").(float64)

	type CompleteRequest struct {
		FileIdentifier string `json:"fileIdentifier"`
		OriginalName   string `json:"originalName"`
		TotalChunks    int    `json:"totalChunks"`
		TotalSize      int64  `json:"totalSize"`
	}

	var req CompleteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Requisição inválida"})
	}

	cfg := config.LoadConfig()
	tempDir := filepath.Join(cfg.UploadDir, "tmp", fmt.Sprintf("%d_%s", int(clientID), req.FileIdentifier))
	finalFileDir := filepath.Join(cfg.UploadDir, "files")
	os.MkdirAll(finalFileDir, os.ModePerm)

	// Gera o link de acesso único (slug)
	accessLink := uuid.New().String()

	newFile := models.File{
		ClientID:     uint(clientID),
		OriginalName: req.OriginalName,
		Size:         req.TotalSize,
		AccessLink:   accessLink,
		DiskPath:     "", 
	}
	
	if err := config.DB.Create(&newFile).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar registro"})
	}

	finalFilePath := filepath.Join(finalFileDir, newFile.ID)

	// Unir os chunks em um arquivo só
	out, err := os.Create(finalFilePath)
	if err != nil {
		config.DB.Delete(&newFile)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar arquivo final no disco"})
	}
	defer out.Close()

	for i := 0; i < req.TotalChunks; i++ {
		chunkPath := filepath.Join(tempDir, strconv.Itoa(i))
		chunkData, err := os.ReadFile(chunkPath)
		if err != nil {
			config.DB.Delete(&newFile)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Chunk %d faltando", i)})
		}
		out.Write(chunkData)
	}

	// Deleta os chunks temporários
	os.RemoveAll(tempDir)

	// Atualiza o registro
	newFile.DiskPath = finalFilePath
	config.DB.Save(&newFile)

	return c.JSON(fiber.Map{
		"message": "Upload completo com sucesso",
		"fileId":  newFile.ID,
		"accessLink": newFile.AccessLink,
	})
}

func DownloadFile(c *fiber.Ctx) error {
	accessLink := c.Params("access_link")

	var file models.File
	if err := config.DB.Where("access_link = ?", accessLink).First(&file).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Arquivo não encontrado ou já expirado"})
	}

	// Verifica se o arquivo físico existe
	if _, err := os.Stat(file.DiskPath); os.IsNotExist(err) {
		// Inconsistência: existe no banco mas não no disco
		config.DB.Delete(&file)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Arquivo físico não encontrado no disco do servidor"})
	}

	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file.OriginalName))
	return c.SendFile(file.DiskPath)
}

func ListFiles(c *fiber.Ctx) error {
	clientID := c.Locals("clientID").(float64)

	var files []models.File
	if err := config.DB.Where("client_id = ?", uint(clientID)).Find(&files).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar arquivos"})
	}

	return c.JSON(files)
}

func DeleteFile(c *fiber.Ctx) error {
	clientID := c.Locals("clientID").(float64)
	fileID := c.Params("id")

	var file models.File
	if err := config.DB.Where("id = ? AND client_id = ?", fileID, uint(clientID)).First(&file).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Arquivo não encontrado"})
	}

	// Remove do disco
	if file.DiskPath != "" {
		os.Remove(file.DiskPath)
	}

	// Remove do banco
	config.DB.Delete(&file)

	return c.JSON(fiber.Map{"message": "Arquivo excluído com sucesso"})
}

func RegenerateLink(c *fiber.Ctx) error {
	clientID := c.Locals("clientID").(float64)
	fileID := c.Params("id")

	var file models.File
	if err := config.DB.Where("id = ? AND client_id = ?", fileID, uint(clientID)).First(&file).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Arquivo não encontrado"})
	}

	// Gera novo link
	file.AccessLink = uuid.New().String()
	config.DB.Save(&file)

	return c.JSON(fiber.Map{
		"message": "Link regenerado com sucesso",
		"accessLink": file.AccessLink,
	})
}
