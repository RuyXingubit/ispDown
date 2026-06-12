package services

import (
	"log"
	"os"
	"syscall"
	"time"

	"github.com/ruyxingubit/isptransfer/internal/config"
	"github.com/ruyxingubit/isptransfer/internal/models"
)

// Inicia o loop infinito que roda a cada 10 minutos
func StartCleanupCron() {
	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for {
			<-ticker.C
			runCleanup()
		}
	}()
}

func runCleanup() {
	cfg := config.LoadConfig()
	log.Println("[CRON] Iniciando rotina de limpeza...")

	// 1. Apagar arquivos mais velhos que 24h
	threshold24h := time.Now().Add(-24 * time.Hour)
	var oldFiles []models.File
	config.DB.Where("created_at < ?", threshold24h).Find(&oldFiles)

	for _, f := range oldFiles {
		log.Printf("[CRON] Deletando arquivo expirado (>24h): %s", f.ID)
		os.Remove(f.DiskPath)
		config.DB.Delete(&f)
	}

	// 2. Verificar espaço em disco
	if isDiskAlmostFull(cfg.UploadDir) {
		log.Println("[CRON] AVISO: Disco acima de 90%. Iniciando deleção forçada de arquivos mais antigos.")
		
		// Apaga um a um o mais antigo até estabilizar abaixo de 85%
		for isDiskAlmostFull(cfg.UploadDir) {
			var oldestFile models.File
			// Pega o mais antigo
			if err := config.DB.Order("created_at asc").First(&oldestFile).Error; err != nil {
				log.Println("[CRON] Não há mais arquivos no banco para deletar, mas o disco continua cheio!")
				break
			}
			
			log.Printf("[CRON] Deletando arquivo por falta de espaço: %s", oldestFile.ID)
			os.Remove(oldestFile.DiskPath)
			config.DB.Delete(&oldestFile)
		}
	}
}

func isDiskAlmostFull(path string) bool {
	// Cria a pasta caso não exista para evitar erro no Statfs
	os.MkdirAll(path, os.ModePerm)
	
	var stat syscall.Statfs_t
	err := syscall.Statfs(path, &stat)
	if err != nil {
		log.Printf("Erro ao verificar espaço no disco: %v", err)
		return false // Previne deleção acidental se der erro de leitura
	}

	// Calcula os blocos disponíveis vs totais
	total := stat.Blocks * uint64(stat.Bsize)
	free := stat.Bavail * uint64(stat.Bsize)
	used := total - free

	percentUsed := (float64(used) / float64(total)) * 100
	return percentUsed >= 90.0
}
