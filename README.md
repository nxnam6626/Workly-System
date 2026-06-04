<div align="center">
  <img src="web-client/public/logos/logo.png" alt="Workly Logo" width="150" height="150" style="border-radius: 20px;"/>
  <h1>Workly System</h1>
  <p><em>Next-generation intelligent recruitment platform powered by Artificial Intelligence</em></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  </p>
</div>

<br />

<details>
  <summary><b>TABLE OF CONTENTS</b> (Click to expand)</summary>

  - [Introduction](#introduction)
  - [Key Features](#key-features)
  - [Technology Stack](#technology-stack)
  - [System Architecture](#system-architecture)
  - [Installation Guide](#installation-guide)
  - [Testing](#testing)
  - [Deployment](#deployment)
</details>

---

## Introduction

**Workly System** is a comprehensive recruitment ecosystem that integrates Google Gemini directly into the core platform architecture.

The platform's mission is to optimize the interaction points between Recruiters and Candidates by:
- Automating the CV screening and recommendation process.
- Optimizing Job Descriptions (JD) using generative AI.
- Synchronizing information flows via real-time WebSocket notifications.
- Delivering a modern, seamless, and reliable user experience.

---

## Key Features

### For Candidates
- **AI CV Parsing**: Automatically extracts skills, experience, and education from PDF files with high accuracy.
- **Personal AI Assistant**: Chatbot support for answering queries, career path consulting, and 24/7 job recommendations.
- **Advanced Search**: Search engine with integrated advanced filters (salary, location, work model).
- **Real-time Application Tracking**: Receive instant notifications via Socket.IO when a recruiter views a CV or sends an interview invitation.

### For Recruiters
- **Rapid AI JD Generation**: Automatically writes and optimizes Job Descriptions based on brief keywords.
- **Intelligent Matching System**: Background workers automatically scan, calculate matching scores, and send application invitations.
- **Applicant Tracking System (ATS)**: Kanban board interface for dragging and dropping candidates, managing saved profiles.
- **Statistical Dashboard**: Multi-dimensional reporting on posting performance, views, and conversion rates.
- **Integrated Payments**: Deposit credits to post jobs via the automated PayOS QR Code payment gateway.
- **Real-time Notifications**: Utilizes toast notifications combined with Socket.IO for all critical activities.

### For Administrators
- **AI Moderation**: Automatically assigns a Risk Score to new job postings to detect spam or fraudulent content.
- **Comprehensive System Management**: Manage user accounts (Recruiter/Candidate), manual posting approvals, and revenue administration.
- **Real-time Monitoring**: Transparently track system activities with real-time alerts.

---

## Technology Stack

The robust and flexible system architecture is built entirely with **TypeScript**:

### Web Client (Frontend)
- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4, Framer Motion (Micro-animations)
- **State Management**: Zustand (Global state), SWR (Data fetching)
- **UI Components**: Lucide Icons, React Hot Toast
- **Maps**: Leaflet (react-leaflet)
- **Real-time**: Socket.IO Client

### Server (Backend)
- **Framework**: NestJS 11 (Modular architecture, Dependency Injection)
- **Database**: PostgreSQL with **Prisma ORM**
- **AI Engine**: Google Generative AI (Gemini)
- **Search Engine**: ElasticSearch
- **Queue & Background Jobs**: Redis + BullMQ (Heavy task processing, emails)
- **WebSockets**: Socket.IO Gateway

### Cloud & 3rd Party Integrations
- **Storage**: Cloud Storage (Avatar, PDF CVs)
- **Payments**: PayOS API

---

## System Architecture

The project is organized in a **Monorepo** structure, facilitating logic sharing and code management:

```text
Workly-System/
├── server/                     # NESTJS BACKEND
│   ├── src/
│   │   ├── modules/            # Domain logic (auth, jobs, ai, admin, ...)
│   │   ├── prisma/             # DB Schema (schema.prisma) & Migrations
│   │   └── main.ts             # Entry point
│   ├── test/                   # Unit Tests
│   └── package.json    
├── web-client/                 # NEXTJS FRONTEND
│   ├── app/                    # App Router (Recruiter, Admin, Public...)
│   ├── components/             # Reusable UI Components & Modals
│   ├── lib/                    # Utils, API Client (Axios)
│   ├── stores/                 # Zustand State
│   └── package.json    
└── README.md
```

---

## Installation Guide

### 1. Environmental Requirements
- **Node.js**: Version `>= 20.0.0`
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Search**: ElasticSearch (Optional for local development)

### 2. Backend Setup (NestJS)

```bash
cd server

# Install dependencies
npm install

# Initialize environment variables
cp .env.example .env
# Edit .env and update DATABASE_URL, REDIS_PORT, GEMINI_API_KEY, etc. Ensure PORT=3001.

# Initialize Database Schema
npx prisma generate
npx prisma db push

# Start the server
npm run start:dev
# API will run at: http://localhost:3001
```

### 3. Frontend Setup (Next.js)

```bash
# Open a new terminal
cd web-client

# Install dependencies
npm install

# Initialize environment variables
cp .env.example .env.local
# Edit .env.local and update NEXT_PUBLIC_API_URL to http://localhost:3001

# Start the web client
npm run dev
# Website will run at: http://localhost:3000
```

---

## Testing

The system includes automated tests to ensure maximum stability:

- **Unit & Integration Tests (Backend)**: Using Jest.
  ```bash
  cd server && npm run test
  ```

---

## Deployment

The system is ready for production deployment on modern cloud platforms:

1. **Frontend**: Highly optimized for deployment on **Vercel**. Provide environment variables in the Vercel dashboard.
2. **Backend**: Compatible with Container/PaaS services such as **Render**, **Railway**, or VPS environments.
3. **Database**: Managed PostgreSQL services like **Supabase**, **NeonDB**, or AWS RDS.

*Note: Configure Redis carefully in production to ensure BullMQ processes background jobs stably.*
