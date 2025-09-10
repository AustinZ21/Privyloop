# Feature Flags (Web UI)

Purpose: keep the main dashboard visuals stable while optionally overlaying live data and enabling enterprise modules — without code churn.

## Flags

- `NEXT_PUBLIC_FEATURE_LIVE_CARDS`
  - Type: boolean (`true` | `false`)
  - When `true`: overlays all live card metrics (Last scan, Privacy score, Risk badge)
  - When `false`: preserves curated demo values and current visuals

- `NEXT_PUBLIC_DEPLOYMENT_MODE`
  - Type: enum (`open-source` | `enterprise`)
  - Controls Enterprise-only modules on the Analytics page (e.g., change tracking, trends, admin refresh)

## Recommended Defaults

- Open Source
  - `NEXT_PUBLIC_DEPLOYMENT_MODE=open-source`
  - `NEXT_PUBLIC_FEATURE_LIVE_CARDS=false`

- Enterprise
  - `NEXT_PUBLIC_DEPLOYMENT_MODE=enterprise`
  - `NEXT_PUBLIC_FEATURE_LIVE_CARDS=true`

## Templates

- `packages/web/.env.oss` (copy → `.env.local` for OSS runs)
- `packages/web/.env.enterprise` (copy → `.env.local` for Enterprise runs)

## Behavior & Fallbacks

- Cards: overlays only when live data exists; otherwise keeps curated values.
- Analytics: enterprise modules appear only when `DEPLOYMENT_MODE=enterprise`.
- Admin refresh (Enterprise): requires `AI_ADMIN_TOKEN` header.

## CI/CD Recipes

- OSS build: copy `packages/web/.env.oss` → `packages/web/.env.local`
- Enterprise build: copy `packages/web/.env.enterprise` → `packages/web/.env.local`

## Notes

- Flags are client-safe (`NEXT_PUBLIC_`), but `AI_ADMIN_TOKEN` must be kept secret — only sent as a request header from trusted contexts.
- See also: `docs/ai-analysis.md` for AI integration details.

