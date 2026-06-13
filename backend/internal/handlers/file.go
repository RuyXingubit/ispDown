package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ruyxingubit/ispdown/internal/config"
	"github.com/ruyxingubit/ispdown/internal/models"
)

// --- FILE HANDLERS ---

func UploadChunk(c *fiber.Ctx) error {
	// Requer JWT Token do Cliente
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	clientID := uint(claims["id"].(float64))

	// Pegar os dados do chunk
	fileIdentifier := c.FormValue("fileIdentifier") // Ex: "uuid-do-frontend"
	chunkIndex := c.FormValue("chunkIndex")
	
	fileHeader, err := c.FormFile("chunk")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Chunk não enviado"})
	}

	// Definir pasta e arquivo temporário para montagem
	cfg := config.LoadConfig()
	tempDir := filepath.Join(cfg.UploadDir, "tmp", fmt.Sprintf("%d_%s", clientID, fileIdentifier))
	
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
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	clientID := uint(claims["id"].(float64))

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
	tempDir := filepath.Join(cfg.UploadDir, "tmp", fmt.Sprintf("%d_%s", clientID, req.FileIdentifier))
	finalFileDir := filepath.Join(cfg.UploadDir, "files")
	os.MkdirAll(finalFileDir, os.ModePerm)

	// O nome no disco vai ser o UUID do banco de dados (que criaremos agora)
	newFile := models.File{
		ClientID:     clientID,
		OriginalName: req.OriginalName,
		Size:         req.TotalSize,
		DiskPath:     "", // Vamos preencher após criar e gerar o UUID
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
	})
}

func DownloadFile(c *fiber.Ctx) error {
	fileID := c.Params("id")

	var file models.File
	if err := config.DB.Where("id = ?", fileID).First(&file).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Arquivo não encontrado ou já expirado"})
	}

	// Verifica se o arquivo físico existe
	if _, err := os.Stat(file.DiskPath); os.IsNotExist(err) {
		// Inconsistência: existe no banco mas não no disco
		config.DB.Delete(&file)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Arquivo físico não encontrado no disco do servidor"})
	}

	// Opcional: registrar logs de quem baixou, quantidade de downloads, etc.

	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file.OriginalName))
	return c.SendFile(file.DiskPath)
}

// Fim do arquivo
