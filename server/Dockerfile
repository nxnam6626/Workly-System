# Use official Node.js image as the base
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies and generated prisma client
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

# Copy package info and production node_modules
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Start server
CMD ["npm", "run", "start:prod"]
