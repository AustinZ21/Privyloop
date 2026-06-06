<!--
Sync Impact Report
- Version change: template placeholders -> 1.0.0 initial project constitution
- Updated sections: project principles, constraints, workflow, governance
- Artifacts reviewed for alignment: README.md, docs/privyloop-PRD.md, docs/privyloop-System-Architecture.md
- No template changes required for this initial draft
-->

# PrivyLoop Constitution

## Core Principles

### I. Privacy Trust Over Feature Hype
PrivyLoop exists to help users understand and manage privacy settings across online platforms. Every feature, interface, integration, and explanation must reinforce user trust. The repository must not exaggerate platform coverage, security guarantees, or monitoring fidelity beyond what the code and docs can actually support.

### II. Explainability Over Black-Box Automation
PrivyLoop can use AI to summarize privacy settings, risk, or recommendations, but it must remain clear what came from structured platform data, what came from deterministic business logic, and what came from model-generated interpretation. Plain-English explanations are part of the product value, and they should remain inspectable, bounded, and honest about uncertainty.

### III. Deployment Boundaries Must Stay Explicit
PrivyLoop supports both self-hosted and managed-cloud product narratives. Those two modes may share code, but their assumptions must stay explicit. The repository must not silently blur local-only behavior, hosted-only behavior, enterprise aspirations, and future roadmap ideas into one ambiguous promise.

### IV. Platform Connectors Must Be Bounded And Auditable
Privacy scraping, snapshotting, and template extraction are high-trust operations. Platform-specific code should stay modular, testable, and explicit about selectors, assumptions, and fallback behavior. New platform coverage should prefer bounded adapters over sprawling one-off logic, and every connector should make failure behavior understandable.

### V. Monorepo Clarity Beats Hidden Coupling
This monorepo should remain easy to reason about. `packages/core` owns shared business logic, schemas, and services. `packages/web` owns the dashboard experience. Extension and enterprise packages may exist, but their responsibilities must stay legible. Documentation, specs, and code should reduce confusion about what is active, planned, legacy, or placeholder.

## Technical And Product Constraints

- Privacy-sensitive user data must be treated as high-trust product data in both code and docs.
- AI analysis should degrade gracefully with provider fallbacks rather than hard-failing the product experience.
- Self-hosted setup should remain practical for local development and evaluation.
- Managed-cloud positioning should not imply implementation completeness where only architecture or planning exists.
- Browser-extension and scraping behavior must remain explicit about platform permissions and assumptions.
- Repo-level docs should clearly distinguish current implementation from roadmap or legacy planning material.

## Development Workflow And Quality Gates

- Changes that affect privacy interpretation, authentication, scraping, or data persistence should include tests or clearly stated validation limits.
- User-facing setup changes must update README and relevant docs.
- New platform-specific code should include bounded selectors, extraction rationale, and failure handling.
- AI-facing changes should document provider order, fallback behavior, and expected output shape.
- Monorepo additions should preserve clear ownership between packages instead of introducing hidden cross-package coupling.

## Governance

This constitution supersedes ad hoc preferences in specs, plans, tasks, issues, and reviews. When there is tension between shipping a flashy feature and preserving privacy trust, explanation quality, or architectural clarity, the constitution wins.

Amendment rules:

- Amendments must be explicit edits to this file.
- Major principle changes should be reflected in README and system architecture docs.
- Future spec-driven artifacts must treat these principles as binding constraints, not optional guidance.
- Legacy planning documents may inform context, but current code and this constitution define the active truth.

**Version**: 1.0.0 | **Ratified**: 2026-06-06 | **Last Amended**: 2026-06-06
