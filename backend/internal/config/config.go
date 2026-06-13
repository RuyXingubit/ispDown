package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPass        string
	DBName        string
	JWTSecret     string
	UploadDir     string
	AdminUsername string
	AdminPassword string
}

func LoadConfig() *Config {
	_ = godotenv.Load() // Ignora erro se não tiver .env

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:          port,
		DBHost:        os.Getenv("DB_HOST"),
		DBPort:        os.Getenv("DB_PORT"),
		DBUser:        os.Getenv("DB_USER"),
		DBPass:        os.Getenv("DB_PASSWORD"),
		DBName:        os.Getenv("DB_NAME"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		UploadDir:     os.Getenv("UPLOAD_DIR"),
		AdminUsername: os.Getenv("ADMIN_USERNAME"),
		AdminPassword: os.Getenv("ADMIN_PASSWORD"),
	}
}
