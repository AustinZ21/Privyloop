# PrivyLoop

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-111111?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Playwright](https://img.shields.io/badge/Tested%20With-Playwright-45ba63?logo=playwright&logoColor=white)](https://playwright.dev/)

PrivyLoop is a privacy-focused platform for tracking and understanding changes to privacy settings across major online platforms. It combines a web dashboard, platform-specific scraping logic, AI-generated plain-English explanations, and a browser-extension path for privacy monitoring workflows.

This repository is a monorepo prototype for a dual-mode product:

- **self-hosted** for users who want control over data and infrastructure
- **managed cloud** for a hosted privacy monitoring experience

## What It Does

- tracks platform privacy templates and user-specific privacy snapshots
- explains privacy settings in plain English using AI-backed analysis
- highlights changes across scans and historical snapshots
- organizes supported platforms such as Google, Facebook, LinkedIn, OpenAI, and Claude
- supports a web dashboard plus an extension-oriented monitoring path
- keeps core business logic in shared TypeScript packages across deployments

## Repo Structure

```text
packages/
  core/         shared database, auth, services, scraping, AI analysis
  web/          Next.js 15 dashboard application
  extension/    browser extension prototype and UI assets
  enterprise/   enterprise-specific package surface

docs/           product, architecture, AI analysis, and feature docs
tests/          e2e and test utilities
install/        helper install scripts
```

## Architecture At A Glance

```text
Browser Extension / Platform Access
        |
        v
Scraping + Template System (packages/core)
        |
        v
PostgreSQL + Privacy Snapshots + Audit Records
        |
        v
AI Analysis Services (Gemini / OpenAI / fallback)
        |
        v
Next.js Dashboard (packages/web)
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker Desktop

### 1. Install dependencies

```bash
git clone https://github.com/AustinZ21/Privyloop.git
cd Privyloop
pnpm install
```

### 2. Start local PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 3. Set local environment files

```bash
cp .env.local.example .env.local
cp packages/web/.env.local.example packages/web/.env.local
```

### 4. Initialize the database

```bash
pnpm -F @privyloop/core db:setup
pnpm -F @privyloop/core db:seed
```

### 5. Run the app

```bash
pnpm dev:web
```

Open `http://localhost:3030`.

## Monorepo Commands

```bash
pnpm dev
pnpm build
pnpm test
pnpm test:e2e
pnpm type-check
```

Useful package-specific commands:

```bash
pnpm -F @privyloop/core db:push
pnpm -F @privyloop/core db:studio
pnpm -F @privyloop/core ai:backfill
pnpm -F @privyloop/web dev
```

## Supported Platforms

Current code and docs reference support or planned support for:

- Google
- Facebook
- LinkedIn
- OpenAI
- Claude / Anthropic

Platform coverage is not uniform. Some integrations are more complete than others, and some remain template or architecture-level groundwork.

## Product Shape

PrivyLoop is most compelling as a **privacy monitoring and explanation platform**, not merely a settings dashboard. The repository already shows three strong product layers:

- **tracking**: privacy snapshots and change history
- **interpretation**: AI-generated plain-English summaries and risk framing
- **action**: direct platform links and guided follow-up steps

## Current Boundaries

PrivyLoop is not yet a finished commercial SaaS product. The repository includes strong architecture and product intent, but still mixes:

- active implementation
- prototype surfaces
- future package seats
- legacy planning artifacts

That is fine for an early open-source product repo, but contributors should keep the boundaries explicit.

## Documentation

- Product requirements: [docs/privyloop-PRD.md](docs/privyloop-PRD.md)
- System architecture: [docs/privyloop-System-Architecture.md](docs/privyloop-System-Architecture.md)
- AI analysis: [docs/ai-analysis.md](docs/ai-analysis.md)
- Feature flags: [docs/feature-flags.md](docs/feature-flags.md)
- Test guidance: [tests/e2e/README.md](tests/e2e/README.md)

## Contributing

Issues and pull requests are welcome. Good contribution areas:

- improve platform template extraction logic
- improve dashboard clarity and privacy change visualization
- tighten AI analysis prompts and fallback behavior
- improve self-hosted setup and docs
- expand testing coverage around scraping and auth flows

## License

This repository is currently licensed under the [MIT License](LICENSE).
