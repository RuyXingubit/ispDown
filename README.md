# ispDown 🚀

Um serviço de transferência de arquivos gigantes (até 20GB) focado em Provedores de Internet (ISPs) e seus clientes. Desenvolvido para ter máxima performance e ocupar a mínima quantidade de RAM na sua VPS através de processamento em *Chunks* (Pedaços).

## Tecnologias Principais
- **Backend:** Go (Golang) com Fiber e GORM.
- **Frontend:** React com Vite (TypeScript).
- **Banco de Dados:** PostgreSQL.
- **DevOps:** Docker, Docker Compose, GitHub Actions (Semantic Release).

## Como Funciona?
1. O administrador (Provedor) cadastra o cliente com **CPF** e um **PIN de 4 dígitos**.
2. O cliente faz login.
3. O cliente seleciona um arquivo de até 20GB. O Frontend divide esse arquivo em pequenas partes (Chunks de 5MB) e as envia sequencialmente para o Backend.
4. O Backend anexa os chunks diretamente no disco, prevenindo o esgotamento de RAM.
5. Um Cron Job interno no Go limpa automaticamente arquivos com mais de **24 horas** de idade, ou caso o disco do servidor atinja **90%** de uso.

## Instalação Local (Para Desenvolvedores)

1. Clone o repositório:
```bash
git clone https://github.com/xingubit/ispDown.git
cd ispDown
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
*Edite o arquivo `.env` com suas senhas e configurações desejadas.*

3. Rode o projeto com Docker Compose:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:8080`

## Instalação em Produção (VPS via DockerHub)

Para servidores de produção, não é necessário clonar todo o código fonte e nem usar ferramentas de compilação. Usamos as imagens prontas e super leves armazenadas no nosso DockerHub (`xingubit/ispdown-backend` e `xingubit/ispdown-frontend`).

1. **Crie a pasta de Uploads (Obrigatório):**
   Crie uma pasta no seu disco secundário com grande espaço (ex: `/var/isp-transfer/uploads`). É nela que os arquivos de 20GB dos clientes serão salvos sem estourar o disco principal do sistema operacional.
   ```bash
   sudo mkdir -p /var/isp-transfer/uploads
   sudo chmod 777 /var/isp-transfer/uploads
   ```

2. **Baixe apenas o arquivo de Compose de Produção:**
   ```bash
   curl -O https://raw.githubusercontent.com/RuyXingubit/ispDown/main/docker-compose.prod.yml
   ```

3. **Configure o `.env` no mesmo diretório:**
   ```bash
   nano .env
   # Insira suas senhas de banco de dados e JWT
   ```

4. **Inicie os serviços:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

> Para detalhes avançados de como montar fisicamente um HD Secundário no Linux e conectá-lo na pasta, veja o guia detalhado [docs/MANUAL.md](./docs/MANUAL.md).

## Contribuindo
Este projeto é open-source. Sinta-se livre para abrir *Issues* ou enviar *Pull Requests*. Lembre-se de seguir o padrão de **Conventional Commits** (ex: `feat: x`, `fix: y`) pois utilizamos o Semantic Release para versionamento automático.
