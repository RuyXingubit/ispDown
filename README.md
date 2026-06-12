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

## Instalação em Produção (VPS)
Veja o arquivo [docs/MANUAL.md](./docs/MANUAL.md) para instruções detalhadas de como montar um disco secundário seguro na VPS e usar o `docker-compose.prod.yml` que puxa a imagem levíssima do DockerHub.

## Contribuindo
Este projeto é open-source. Sinta-se livre para abrir *Issues* ou enviar *Pull Requests*. Lembre-se de seguir o padrão de **Conventional Commits** (ex: `feat: x`, `fix: y`) pois utilizamos o Semantic Release para versionamento automático.
