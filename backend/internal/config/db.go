package config

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB(cfg *Config) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		cfg.DBHost, cfg.DBUser, cfg.DBPass, cfg.DBName, cfg.DBPort)

	// Se os parametros nao estiverem setados, ignora por enquanto para testes locais
	if cfg.DBHost == "" {
		log.Println("Aviso: Configurações de DB não encontradas. Conexão ignorada (APENAS PARA DEV).")
		return
	}

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Falha ao conectar no banco de dados", err)
	}

	DB = database
	log.Println("Conectado ao banco de dados com sucesso!")
}
