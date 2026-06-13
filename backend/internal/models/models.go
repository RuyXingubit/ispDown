package models

import (
	"time"

	"gorm.io/gorm"
)

type Provider struct {
	ID        uint      `gorm:"primaryKey"`
	Username  string    `gorm:"uniqueIndex;not null"`
	Password  string    `gorm:"not null"` // Senha hasheada
	MustChangePassword bool      `gorm:"default:true"`
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type Client struct {
	ID         uint      `gorm:"primaryKey"`
	ProviderID uint      `gorm:"not null"`
	Name       string    `gorm:"not null"`
	CPF        string    `gorm:"uniqueIndex;not null"`
	PIN        string    `gorm:"not null"` // PIN de 4 digitos em texto simples ou hash (recomendado hash)
	IsActive   bool      `gorm:"default:true"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type File struct {
	ID           string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ClientID     uint      `gorm:"not null"`
	OriginalName string    `gorm:"not null"`
	AccessLink   string    `gorm:"uniqueIndex;not null"`
	DiskPath     string    `gorm:"not null"`
	Size         int64     `gorm:"not null"`
	CreatedAt    time.Time
}

// AutoMigrate executa a migração automática das tabelas
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&Provider{}, &Client{}, &File{})
}
