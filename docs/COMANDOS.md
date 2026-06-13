# 🐳 Comandos Docker — ispDown

## 🚀 Atualizar para a última versão (deploy na VPS)

Após um novo release publicado pelo CI, rode na VPS:

```bash
docker compose -f docker-compose.prod.yml pull && \
docker compose -f docker-compose.prod.yml up -d
```

> Baixa as imagens `:latest` do DockerHub e reinicia apenas os containers que mudaram.

---

## ▶️ Subir os containers (primeira vez ou após parada)

```bash
docker compose -f docker-compose.prod.yml up -d
```

## ⏹️ Parar todos os containers

```bash
docker compose -f docker-compose.prod.yml down
```

## 🔄 Reiniciar um serviço específico

```bash
# backend
docker compose -f docker-compose.prod.yml restart backend

# frontend
docker compose -f docker-compose.prod.yml restart frontend
```

---

## 📋 Ver status dos containers

```bash
docker compose -f docker-compose.prod.yml ps
```

## 📜 Ver logs em tempo real

```bash
# Todos os serviços
docker compose -f docker-compose.prod.yml logs -f

# Só o backend
docker compose -f docker-compose.prod.yml logs -f backend

# Só o caddy (SSL / proxy)
docker compose -f docker-compose.prod.yml logs -f caddy
```

---

## 🗄️ Banco de Dados (PostgreSQL)

```bash
# Acessar o shell do banco
docker exec -it ispdown-db psql -U ${DB_USER} -d ${DB_NAME}

# Backup manual do banco
docker exec ispdown-db pg_dump -U ${DB_USER} ${DB_NAME} > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup.sql | docker exec -i ispdown-db psql -U ${DB_USER} -d ${DB_NAME}
```

---

## 🧹 Limpeza

```bash
# Remove imagens antigas não utilizadas (libera espaço)
docker image prune -f

# Remove tudo que não está em uso (imagens, redes, volumes órfãos)
docker system prune -f
```

---

## 🔍 Inspecionar um container

```bash
# Ver variáveis de ambiente do backend
docker inspect ispdown-backend | grep -A 30 '"Env"'

# Entrar no shell do backend
docker exec -it ispdown-backend sh
```

---

## ⚙️ Fluxo de release automático

```
git push (fix:/feat:)
    └─▶ GitHub Actions
            ├─▶ semantic-release → cria tag + CHANGELOG
            └─▶ Docker build & push → DockerHub (:latest + :x.y.z)
                                            └─▶ VPS: docker pull + up -d
```
