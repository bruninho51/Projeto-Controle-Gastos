# Etapa 1 — build com Prisma + devDependencies
FROM node:20-alpine AS builder
WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (dev incluídas)
RUN npm install

# Copia Prisma e gera o client com binários corretos
COPY prisma ./prisma
RUN npx prisma generate

# Copia o restante da aplicação e compila
COPY . .
RUN npm run build

# Etapa 2 — imagem final com apenas dependências de produção
FROM node:20-alpine
WORKDIR /app

# Copia apenas arquivos necessários
COPY package*.json ./

# Instala só as dependências de produção
RUN npm install --production

# Copia o Prisma Client já gerado e o build final
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
RUN npx prisma generate

# Copia o entrypoint
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expõe a porta da aplicação
EXPOSE 3000

# Define o entrypoint
ENTRYPOINT ["entrypoint.sh"]

# Comando padrão
CMD ["node", "dist/src/main.js"]