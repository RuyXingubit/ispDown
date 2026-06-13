package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/ruyxingubit/ispdown/internal/config"
	"github.com/ruyxingubit/ispdown/internal/models"
	"github.com/ruyxingubit/ispdown/internal/routes"
	"github.com/ruyxingubit/ispdown/internal/services"
)

func main() {
	// Carrega configuração
	cfg := config.LoadConfig()

	// Inicializa o banco de dados
	config.ConnectDB(cfg)

	// Cria/Atualiza as tabelas automaticamente
	if config.DB != nil {
		if err := models.AutoMigrate(config.DB); err != nil {
			log.Fatal("Falha ao rodar migrations: ", err)
		}
	}

	// Inicializa Fiber
	app := fiber.New(fiber.Config{
		BodyLimit: 20 * 1024 * 1024 * 1024, // 20GB limit
	})

	// Setup Rotas
	routes.SetupRoutes(app)

	// Inicia rotina de limpeza (roda a cada 10 min)
	services.StartCleanupCron()

	log.Printf("Backend rodando na porta %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
