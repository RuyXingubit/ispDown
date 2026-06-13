package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/ruyxingubit/ispdown/internal/handlers"
	"github.com/ruyxingubit/ispdown/internal/middleware"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Rota de Healthcheck
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Rotas do Admin/Provider
	admin := api.Group("/admin")
	admin.Post("/login", handlers.AdminLogin)
	
	// Rotas protegidas do Admin
	adminProtected := admin.Group("/", middleware.AdminAuth)
	adminProtected.Post("/change-password", handlers.ChangePassword)
	adminProtected.Get("/clients", handlers.ListClients)
	adminProtected.Post("/clients", handlers.CreateClient)

	// Rotas do Cliente
	client := api.Group("/client")
	client.Post("/login", handlers.ClientLogin)

	// Rotas de Upload/Download (a serem implementadas)
	files := api.Group("/files")
	files.Post("/upload", handlers.UploadChunk)
	files.Post("/upload/complete", handlers.UploadComplete)
	files.Get("/download/:id", handlers.DownloadFile)
}
