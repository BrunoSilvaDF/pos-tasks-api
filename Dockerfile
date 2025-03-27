# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar cliente Prisma e compilar TypeScript
RUN npx prisma generate
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS production

WORKDIR /app

# Instalar netcat para o script de entrypoint
RUN apk add --no-cache netcat-openbsd

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production

# Copiar arquivos do estágio de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expor porta
EXPOSE 3000

# Script para aguardar o banco de dados e iniciar a aplicação
COPY ./docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Comando para iniciar a aplicação
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]

