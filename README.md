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

## Instalação em Produção (Para o Provedor)

Se você é um provedor, não precisa compilar código nem entender de programação. Preparamos uma instalação com **3 passos simples** que roda o sistema com HTTPS (SSL Automático) usando Docker.

1. **Crie a pasta para os arquivos gigantes:**
   É obrigatório ter uma pasta (preferencialmente num HD secundário de grande capacidade) para receber os arquivos dos clientes.
   ```bash
   sudo mkdir -p /var/isp-transfer/uploads
   sudo chmod 777 /var/isp-transfer/uploads
   ```

2. **Baixe as configurações prontas:**
   Faça o download dos arquivos vitais de infraestrutura para a sua VPS.
   ```bash
   mkdir ispdown && cd ispdown
   curl -o docker-compose.yml https://raw.githubusercontent.com/RuyXingubit/ispDown/main/docker-compose.prod.yml
   curl -o .env https://raw.githubusercontent.com/RuyXingubit/ispDown/main/.env.example
   ```

3. **Configure o seu domínio e senhas:**
   Edite o arquivo `.env` para colocar o seu domínio real. O sistema usará isso para gerar o "Cadeadinho Verde" (SSL/HTTPS) de graça.
   ```bash
   nano .env
   # Troque a variável DOMAIN para algo como: DOMAIN=envio.seunet.com.br
   # Troque a senha do banco de dados e o JWT_SECRET
   ```

4. **Ligue o Motor!**
   Agora é só rodar o Docker para ele baixar tudo e colocar o site no ar:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```
   Acesse no navegador: `https://seu-dominio-configurado.com.br`!

## Contribuindo
Este projeto é open-source. Sinta-se livre para abrir *Issues* ou enviar *Pull Requests*. Lembre-se de seguir o padrão de **Conventional Commits** (ex: `feat: x`, `fix: y`) pois utilizamos o Semantic Release para versionamento automático.
