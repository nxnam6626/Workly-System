# Workly Web Client

This repository contains the frontend application for the Workly platform. It serves three primary user roles: Candidates, Recruiters, and Administrators, delivering a modern, responsive, and performant user interface.

## Technologies & Frameworks

- Core: Next.js 16 (App Router), React 19
- Language: TypeScript
- Styling: Tailwind CSS v4
- State Management: Zustand (Global state), SWR (Data fetching & Server state)
- Forms & Validation: React Hook Form, Zod
- UI Enhancements: Framer Motion, React Hot Toast, Leaflet (Maps)
- Real-time: Socket.IO Client

## Architecture Overview

The application is structured using the Next.js App Router pattern:

```text
web-client/
├── app/                  # Application routing and pages
│   ├── (auth)/           # Authentication route groups
│   ├── (public)/         # Publicly accessible routes (Home, Job Details)
│   ├── admin/            # Administrator dashboard
│   ├── recruiter/        # Recruiter dashboard
│   ├── globals.css       # Global styles and Tailwind configuration
│   └── layout.tsx        # Root layout wrapper (Providers)
├── components/           # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── recruiter/        # Recruiter-specific components
│   └── ui/               # Base UI components (Buttons, Inputs, etc.)
├── lib/                  # Utilities, custom hooks, and API client config
├── stores/               # Zustand state definitions
└── tailwind.config.ts    # Tailwind CSS configuration
```

## Core Features

- Real-time Updates: Integrates Socket.IO for instant notifications regarding job status and messages.
- Advanced Form Handling: Strict client-side validation using React Hook Form and Zod ensuring data integrity before server submission.
- Micro-Interactions: Smooth transitions and feedback mechanisms utilizing Framer Motion and React Hot Toast.
- Interactive Maps: Integrated location mapping using Leaflet and React Leaflet.

## Prerequisites

- Node.js (v20 or higher)
- Running instance of the Workly Server (Backend)

## Environment Setup

Create a `.env.local` file in the root directory and configure the API endpoints:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Installation & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be accessible at `http://localhost:3000`.

## Deployment

The application is fully optimized for deployment on Vercel. Ensure that all environment variables are properly configured in the Vercel dashboard prior to deployment.
