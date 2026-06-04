# Workly Server

This repository contains the backend service for the Workly platform, built with NestJS. It provides a robust, scalable RESTful API and WebSocket gateway to handle user authentication, job management, AI-driven matching, and payment integrations.

## Architecture & Technologies

- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL (managed via Prisma ORM)
- Caching & Message Queue: Redis
- Authentication: JWT (JSON Web Tokens)
- Integration: PayOS (Payments), Gemini API (AI Services)

## Directory Structure

```text
server/
├── prisma/               # Database schema (schema.prisma) and seed data
├── scripts/              # Utility scripts and validation tools
├── src/
│   ├── modules/          # Core business logic isolated by domains
│   │   ├── ai/           # AI service integrations
│   │   ├── auth/         # Authentication and authorization guards
│   │   ├── jobs/         # Job posting and search functionalities
│   │   └── wallets/      # Payment and wallet integration
│   ├── app.module.ts     # Application root module
│   └── main.ts           # Application entry point
```

## Prerequisites

Ensure the following dependencies are installed on your local environment before proceeding:

- Node.js (v20 or higher)
- PostgreSQL (Running and accessible)
- Redis Server (Running on port 6379)
- ElasticSearch (Optional, for advanced search capabilities)

## Environment Setup

1. Copy the example environment file and configure the necessary variables:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your local configuration:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://user:password@localhost:5432/workly"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   JWT_ACCESS_SECRET="your-access-secret"
   JWT_REFRESH_SECRET="your-refresh-secret"
   GEMINI_API_KEY="your-gemini-key"
   PAYOS_CLIENT_ID="your-payos-client-id"
   PAYOS_API_KEY="your-payos-api-key"
   PAYOS_CHECKSUM_KEY="your-payos-checksum-key"
   ```

## Installation & Database Initialization

1. Install dependencies:
   ```bash
   npm install
   ```

2. Synchronize the database schema and generate the Prisma Client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Seed the database with initial data (Roles, sample users):
   ```bash
   npm run prisma:seed
   ```

## Running the Application

To start the development server:

```bash
npm run start:dev
```

The server will be available at `http://localhost:3001` by default.

## API Documentation

Swagger UI is integrated into the application for API exploration and testing. Once the server is running, navigate to:

`http://localhost:3001/api`
