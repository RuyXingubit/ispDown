# Build Stage
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copiar os arquivos gerados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Configurar o Nginx para Single Page Application e permitir uploads um pouco maiores
RUN echo 'server { \
    listen 80; \
    client_max_body_size 50M; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
