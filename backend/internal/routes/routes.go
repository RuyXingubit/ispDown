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

	// Rotas protegidas do Cliente (Upload, Listagem)
	clientProtected := api.Group("/files", middleware.ClientAuth)
	clientProtected.Get("/", handlers.ListFiles)
	clientProtected.Post("/upload", handlers.UploadChunk)
	clientProtected.Post("/upload/complete", handlers.UploadComplete)
	clientProtected.Delete("/:id", handlers.DeleteFile)
	clientProtected.Post("/:id/regenerate-link", handlers.RegenerateLink)

	// Rota pública de Download
	api.Get("/files/download/:access_link", handlers.DownloadFile)
}
