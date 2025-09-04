## TASK-003 — PrivyLoop UI/UX North‑Star Prompt (for an AI Designer)

Purpose: Generate production‑ready, responsive UI/UX designs and assets for PrivyLoop based on the PRD, with dark‑first visuals, seafoam‑green brand palette, and dashboard patterns inspired by the composition and clarity of [MkSaaS](https://mksaas.com/) and [Resend](https://resend.com) (use as inspiration only; do not copy branding).

### Context
- Product: PrivyLoop — Privacy dashboard + browser extension that monitors and explains privacy settings across platforms.
- Key flows: Onboarding → Connect platforms → Dashboard of privacy cards → Platform detail pages → Upgrade gating at 4+ cards (Free tier limit).
- Tech/UI libraries: Next.js, Tailwind CSS, shadcn/ui. Dark mode default with accessible light variant.

### Brand Palette (Seafoam Green; harmony, safety, growth, health)
- primary-50:  #F0FFF7
- primary-100: #E6FFF2
- primary-200: #CCFBEF
- primary-300: #A5F3DC
- primary-400: #6EE7C7
- primary-500: #34D3A6  (brand base)
- primary-600: #22B08B
- primary-700: #1A8E73
- primary-800: #136F5B
- primary-900: #0F5A49
- primary-950: #0B473C

Neutrals (dark‑first)
- bg-900: #0B0F12
- bg-800: #101518
- bg-700: #141A1E
- bg-600: #1A2126
- border:  #233037

Semantic
- success: primary-500
- warning: #F5B454
- danger:  #EF5A5A
- info:    #3AB9E6

OKLCH anchors (for precise color reproduction)
- primary-500: okLCH(72% 0.09 165)
- primary-700: okLCH(55% 0.08 165)
- danger:      okLCH(60% 0.13 25)
- warning:     okLCH(75% 0.11 85)

Gradients
- Calm Growth: from #22B08B → #34D3A6 → #6EE7C7
- Seafoam Glow: from #0F5A49 → #22B08B

Tailwind tokens (for developers)
```js
// tailwind.config.js (excerpt)
extend: {
  colors: {
    brand: {
      50:'#F0FFF7',100:'#E6FFF2',200:'#CCFBEF',300:'#A5F3DC',
      400:'#6EE7C7',500:'#34D3A6',600:'#22B08B',700:'#1A8E73',
      800:'#136F5B',900:'#0F5A49',950:'#0B473C'
    },
    bg: {900:'#0B0F12',800:'#101518',700:'#141A1E',600:'#1A2126'},
    border:'#233037',
    success:'#34D3A6', warning:'#F5B454', danger:'#EF5A5A', info:'#3AB9E6'
  }
}
```

CSS variables (shadcn‑style)
```css
:root {
  --background: 210 22% 6%;
  --foreground: 0 0% 98%;
  --card: 200 10% 9%;
  --border: 202 23% 18%;
  --primary: 162 64% 51%;            /* #34D3A6 */
  --primary-foreground: 160 100% 10%;
  --success: 162 64% 51%;
  --warning: 36 90% 65%;
  --danger: 3 83% 64%;
}
```

---

### AI Designer Prompt (copy/paste)

You are an AI UI/UX designer. Produce responsive, production‑ready design specs and assets for PrivyLoop. Follow the instructions strictly, optimize for clarity and accessibility, and return assets in the requested formats.

Objectives
1) Landing page that clearly communicates value and drives signups.
2) Dashboard with responsive grid of “business privacy cards” (Google, LinkedIn, etc.).
3) Platform detail page with: plain‑English interpretation, personal recommendations, change tracking/diffs, and GDPR/CCPA alignment summary.
4) Upgrade gating when Free users add a 4th card.

Visual direction
- Dark‑first, high‑contrast neutrals, single bold seafoam accent.
- Soft elevation, gentle glass/blur on cards, restrained gradients (see palette).
- Inspirations for composition/clarity only: MkSaaS and Resend. Do not copy branding, logos, or proprietary visuals.

Layout and responsiveness
- Global shell: left sidebar nav, top bar with scan status.
- Container widths and spacing align to a 4px spacing scale.
- Breakpoints for card grid per row: xs=1, sm=2, md=3, lg=4, xl=5 (auto‑fit min 280–320px).
- Cards must maintain readable density and tap targets ≥44px.

Dashboard privacy cards (tile spec)
- Anatomy: brand logo, platform name, connection status, last scan time, change count, risk chip, CTA “View”.
- States: connected, connecting, failed, scanning (progress), gated (blur + lock + “Upgrade”).
- Interactions: 120–180ms hover lift + subtle glow, clear focus ring, pressed depth.
- Click transitions smoothly to the detail page (fade+slide 20–32px, 220–320ms).

Detail page (per platform)
- Navigation: Tabs or sticky sub‑nav — Overview • Settings • Changes • Compliance.
- Overview: risk score badge, plain‑English privacy summary, last scan, quick actions (Rescan, Open official page).
- Settings: category cards; each shows current state, our interpretation, recommended action with benefits and trade‑offs, and deep link.
- Changes: timeline with before/after diffs; filters for user‑initiated vs platform changes.
- Compliance: GDPR/CCPA checklist with pass/warn/fail, rationale, and links to sources.

Motion and feedback
- Page transitions: 220–320ms ease‑in‑out; overlay 160–220ms.
- Hover/press: 120–180ms ease‑out.
- Loading: skeletons for cards, progress for scans; non‑blocking toast on completion/failure.

Accessibility
- WCAG 2.1 AA contrast or better. Honor reduced‑motion preference (disable nonessential animations).
- Keyboard navigable grid and tabs; visible focus indicators; screen reader labels for risk, status, and counts.

Brand palette and tokens
- Use the Seafoam‑Green palette and neutrals exactly as provided above.
- Primary usage: CTA buttons brand‑500; hover brand‑600; pressed brand‑700.
- Subtle fills use brand‑300/400; borders use `border` token.

Deliverables (return all of the following)
1) Design tokens JSON (colors, radii, shadows, spacing, motion durations/easings).
2) Component specs: Card, Button, Tabs, Tooltip, Toast, Modal, Dropdown, Badge/Chip, Progress, Skeleton, DataTable.
3) Annotated responsive mocks for: Landing, Dashboard, Detail (Overview/Settings/Changes/Compliance), Upgrade modal (desktop/tablet/mobile).
4) Motion spec (durations/easings/keyframes) and state diagrams for card and page transitions.
5) Microcopy pack: headlines, CTAs, helper texts, empty/error states.
6) Optional: sample HTML + Tailwind snippets for hero, card grid, and detail header for dev parity.

Acceptance criteria
- Cards per row match breakpoints; grid keyboard + screen‑reader navigable.
- Detail page clearly separates interpretation, recommendations, changes, and compliance.
- Smooth transition from card → detail with visible focus retention.
- Upgrade gate triggers at 4th card with plan comparison and strong CTA.
- Dark‑first and light variants both pass contrast checks.

Notes
- Keep visuals calm and trustworthy. Avoid neon greens and muddy tones.
- Reference composition from MkSaaS/Resend but create original PrivyLoop visual language.

Output format
- Provide: `tokens.json`, `screens-[device].png` (or SVG), `components.md` (specs), `motion.md` (animations), `microcopy.md`, and optional `snippets.html` with Tailwind classes.

---

### Links
- Inspiration: [MkSaaS](https://mksaas.com/), [Resend](https://resend.com)
- Source: `docs/privyloop-PRD.md`


