# 1. Đổi thành bản Full ở Stage Build
FROM node:22 AS builder

WORKDIR /app

# Install dependencies and generated prisma client
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# 2. Đổi thành bản Full ở Stage Production
FROM node:22

WORKDIR /app

# Copy package info and production node_modules
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Start server
CMD ["npm", "run", "start:prod"]