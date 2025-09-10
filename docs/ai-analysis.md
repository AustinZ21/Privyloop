# AI Analysis (TASK-005)

Purpose: Generate concise, plain-English explanations for platform privacy templates and store them once-per-template in `privacy_templates.ai_analysis`.

Key pieces
- Prompt builder: `packages/core/src/services/ai/analysis-prompt.ts`
- Gemini client (lazy): `packages/core/src/services/ai/gemini-client.ts`
- Analysis service: `packages/core/src/services/ai/analysis-service.ts`
- Engine integration: ensures analysis on template creation/use
- API endpoints:
  - GET ` /api/ai/analysis?platformId=... | templateId=...`
  - POST `/api/ai/analysis/refresh` (header `x-ai-admin-token`)

Env
- `GEMINI_API_KEY` (primary provider)
- `GEMINI_MODEL` (default `gemini-2.5-pro`)
- `OPENAI_API_KEY` (fallback provider)
- `OPENAI_MODEL` (default `gpt-5-mini`)
- `AI_ADMIN_TOKEN` (for refresh endpoint)

Notes
- Provider order: Gemini → OpenAI → heuristic fallback (keeps flows working in dev/tests).
- Output JSON aligns with `privacy_templates.ai_analysis` and includes optional `summary` and `categoryInsights` for UI.
