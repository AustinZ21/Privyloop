# Contributing to PrivyLoop

Thanks for contributing to PrivyLoop.

This repository mixes active implementation, product architecture, and early platform integrations, so the best contributions are focused, scoped, and easy to validate.

## Good First Contributions

- improve README or setup documentation
- tighten UI clarity in the web dashboard
- add tests around existing scraping or auth behavior
- improve AI analysis wording and fallback behavior
- cleanly separate active code from legacy planning artifacts

## Local Setup

```bash
git clone https://github.com/AustinZ21/Privyloop.git
cd Privyloop
pnpm install
docker compose -f docker-compose.dev.yml up -d
cp .env.local.example .env.local
cp packages/web/.env.local.example packages/web/.env.local
pnpm -F @privyloop/core db:setup
pnpm -F @privyloop/core db:seed
pnpm dev:web
```

## Before Opening a PR

- keep changes focused
- update docs if user-facing setup or behavior changes
- add or update tests when changing deterministic logic
- avoid committing secrets, generated logs, or machine-specific files
- call out limitations honestly when a feature is still partial or stubbed

## Scope Notes

PrivyLoop should stay explicit about what is implemented versus planned. Please do not make the repo look more production-complete than it really is without the code and validation to support that claim.
