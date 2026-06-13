package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/ruyxingubit/ispdown/internal/config"
	"github.com/ruyxingubit/ispdown/internal/models"
	"github.com/ruyxingubit/ispdown/internal/routes"
	"github.com/ruyxingubit/ispdown/internal/services"
	_ "github.com/ruyxingubit/ispdown/docs" // Necessário para o Swagger
)

// @title ISPDown API
// @version 1.0
// @description API para gestão de arquivos e integração com ERP de provedores de internet.
// @termsOfService http://swagger.io/terms/

// @contact.name Suporte ISPDown
// @contact.email suporte@ispdown.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host ispdown.proserv.net.br
// @BasePath /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
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
