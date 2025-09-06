# PrivyLoop

[![License: BSL-1.1](https://img.shields.io/badge/License-BSL--1.1-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-1.3.8-green.svg)](https://better-auth.com/)

> Privacy-focused platform for tracking and managing corporate privacy policy changes across multiple platforms.

PrivyLoop empowers users to understand and control their digital privacy through automated monitoring and plain-English insights. Available as both **open-source self-hosted** and **managed cloud service** deployments.

## 🎯 Key Features

- **🔍 Automated Privacy Monitoring**: Background scanning eliminates manual privacy auditing
- **📝 Plain-English Insights**: AI-powered explanations make complex settings understandable  
- **🔔 Change Detection**: Real-time alerts when privacy settings are modified
- **🔗 Direct Action Links**: One-click access to modify settings on original platforms
- **🌐 Multi-Platform Support**: Google, Facebook, LinkedIn, OpenAI, Claude, and more
- **🏠 Dual Deployment**: Choose between self-hosted control or managed convenience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (v9+ recommended)
- Docker Desktop (for local PostgreSQL)
- Git

### 1. Clone and Install

```bash
git clone https://github.com/your-org/privyloop.git
cd privyloop
pnpm install
```

### 2. Database Setup with Docker

PrivyLoop uses PostgreSQL with a simple Docker setup:

```bash
# Start PostgreSQL container
docker compose -f docker-compose.dev.yml up -d

# Verify container is running
docker ps
```

**What this creates:**
- PostgreSQL 15 database named `privyloop`
- Default credentials: `postgres:password`
- Available on `localhost:5432`
- Persistent data storage in Docker volume

> ⚠️ **WARNING**: The above credentials are for local development only. Do not reuse in staging or production. Use strong, unique secrets per environment.

### 3. Initialize Database Schema

```bash
cd packages/core
pnpm db:push
```

This creates all necessary tables:
- ✅ User management and authentication
- ✅ Platform configurations and templates
- ✅ Privacy snapshot tracking and history
- ✅ Audit logging and compliance

### 4. Environment Configuration

**⚠️ Important: Monorepo Setup**

This project has a monorepo structure. You need to configure environment variables in two places:

```bash
# 1. Root environment (core package, database)
cp .env.local.example .env.local

# 2. Web package environment (Next.js app, OAuth)
cp packages/web/.env.local.example packages/web/.env.local
```

**Configure root `.env.local`:**
```bash
# Database (using Docker setup)
DATABASE_URL=postgresql://postgres:password@localhost:5432/privyloop

# Authentication secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-super-secret-key-here-minimum-32-characters

# Application URL
AUTH_URL=http://localhost:3030
```

**Configure `packages/web/.env.local` for OAuth and web app:**
```bash
# Copy your auth secret from root
BETTER_AUTH_SECRET=your-super-secret-key-here-minimum-32-characters

# OAuth providers (for social login)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Next.js public variables
NEXT_PUBLIC_APP_URL=http://localhost:3030
NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted
```

### 5. Start Development

```bash
pnpm dev
```

Visit `http://localhost:3030` to access PrivyLoop!

## 🏗️ Project Architecture

### Monorepo Structure

```
packages/
├── core/              # Shared utilities, database, authentication
│   ├── src/auth/      # Better Auth configuration
│   ├── src/database/  # Drizzle ORM schemas and migrations
│   ├── src/services/  # Email, AI analysis, platform scraping
│   └── src/features/  # Feature flag system
├── web/               # Next.js 15 web application
│   ├── src/app/       # App Router pages and API routes
│   ├── src/components/# UI components (shadcn/ui)
│   └── src/lib/       # Client-side utilities
└── extension/         # Browser extension (future)
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 15 | Full-stack React with App Router |
| **Database** | PostgreSQL 15 | Primary data storage |
| **ORM** | Drizzle ORM | Type-safe database operations |
| **Authentication** | Better Auth 1.3.8 | Multi-provider auth system |
| **UI Framework** | React 18 + shadcn/ui | Modern component library |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Validation** | Zod | Schema validation |
| **AI Integration** | Google Gemini API | Privacy analysis |
| **Email** | Nodemailer | SMTP email delivery |

## 🎛️ Dual Deployment Model

### Self-Hosted (Open Source)
- ✅ **Unlimited Features**: Full access to all core capabilities
- ✅ **No Usage Limits**: Unlimited privacy cards and scans
- ✅ **Your Infrastructure**: Complete control over data and hosting
- ✅ **User-Provided APIs**: Bring your own Gemini, SMTP credentials
- ✅ **Community Driven**: Open source with community contributions

### Cloud Service (Managed)
- ✅ **Managed Infrastructure**: No server maintenance required
- ✅ **Tiered Pricing**: Free (3 cards), Pro ($4.99/mo), Premium ($7.80/mo)
- ✅ **Integrated Services**: Built-in AI, email, and storage
- ✅ **Advanced Analytics**: Usage trends and insights
- ✅ **Professional Support**: Dedicated customer support

## 🔐 Authentication System

PrivyLoop uses Better Auth for comprehensive security:

**Features:**
- Multi-provider OAuth (GitHub, Google, Microsoft)
- Email/password with verification
- Secure session management (7-day sessions, 24-hour refresh)
- CSRF protection and rate limiting
- Complete audit logging

**Testing Authentication:**
1. Start the dev server (`npm run dev`)
2. Create account at `http://localhost:3030`
3. Verify email (check console for verification link)
4. Test social login (if OAuth configured)

## 📊 Database Management

### Common Operations

```bash
# View all tables
docker compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d privyloop -c "\dt"

# Connect to database directly
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d privyloop

# Reset database (removes all data)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
cd packages/core && pnpm db:push

# Stop database
docker compose -f docker-compose.dev.yml down
```

### Schema Overview

**Core Tables:**
- `users` - Authentication, subscriptions, preferences
- `platforms` - Supported services (Google, Facebook, etc.)
- `privacy_templates` - Structured privacy settings schemas  
- `privacy_snapshots` - Historical tracking of user privacy settings
- `user_platform_connections` - User-specific platform integrations
- `audit_logs` - Complete activity tracking

*Better Auth tables (`sessions`, `accounts`, `verification_tokens`) are created automatically.*

## 🛠️ Development Workflow

### Building

```bash
# Build all packages
pnpm build

# Build specific package
cd packages/web && pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Package-specific tests
cd packages/core && pnpm test
```

### Database Development

```bash
cd packages/core

# Generate new migration
pnpm db:generate

# Apply schema changes
pnpm db:push  

# Open database studio
pnpm db:studio
```

## 📋 Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret (min 32 chars)
- `AUTH_URL` - Application base URL

### Optional
- `SMTP_*` - Email configuration for verification
- `GEMINI_API_KEY` - AI analysis service
- `GITHUB_CLIENT_*` - GitHub OAuth
- `GOOGLE_CLIENT_*` - Google OAuth  
- `MICROSOFT_CLIENT_*` - Microsoft OAuth

### Deployment-Specific
- `DEPLOYMENT_MODE` - `self-hosted` or `cloud`
- `NODE_ENV` - `development`, `staging`, `production`
- `NEXT_PUBLIC_*` - Client-side environment variables

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup for Contributors

```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/privyloop.git
cd privyloop

# Install dependencies
pnpm install

# Set up local database
docker compose -f docker-compose.dev.yml up -d
cd packages/core && pnpm db:push

# Configure environment (IMPORTANT: Both locations needed!)
cp .env.local.example .env.local
cp packages/web/.env.local.example packages/web/.env.local
# Edit both files with your settings

# Start development
pnpm dev
```

## 📄 License

This project is licensed under the [Business Source License 1.1](LICENSE).

**Summary:**
- ✅ Free for personal, educational, and non-commercial use
- ✅ Source code is fully visible and auditable
- ✅ Community contributions welcome
- ❌ Commercial hosting of competing services restricted
- 🔄 Converts to Apache 2.0 after 4 years

## 🆘 Support

### Community Support
- 📖 [Documentation](https://docs.privyloop.com)
- 💬 [GitHub Discussions](https://github.com/your-org/privyloop/discussions)
- 🐛 [Issue Tracker](https://github.com/your-org/privyloop/issues)

### Commercial Support
- 🚀 [Cloud Service](https://privyloop.com) - Managed hosting
- 📧 [Enterprise Support](mailto:enterprise@privyloop.com) - Custom implementations

## 🔗 Links

- 🌐 [Website](https://privyloop.com)
- 📚 [Documentation](https://docs.privyloop.com)  
- 🐦 [Twitter](https://twitter.com/privyloop)
- 💼 [LinkedIn](https://linkedin.com/company/privyloop)

---

**Made with ❤️ for digital privacy rights**