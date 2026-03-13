# ZA Support Dashboard
# .claude/INSTRUCTIONS.md — Claude Code reads this automatically every session
# Last Updated: 13/03/2026

## PRODUCT

ZA Support Dashboard is the internal web interface for monitoring client devices,
diagnostic results, and system health across the ZA Support managed client base.
Data is sourced exclusively from the Health Check V11 backend API.

## STACK

Next.js 15 + Tailwind v4 + shadcn/ui on Vercel.
URL: https://dashboard.zasupport.com
Deploy: auto-deploy on push to main branch.
Auth: session-based (DASHBOARD_PASSWORD env var on Vercel).

## BACKEND CONNECTION

API: https://api.zasupport.com
Auth header: X-API-Key <NEXT_PUBLIC_API_KEY>
All data fetched server-side where possible (RSC / route handlers).
Never expose API keys in client-side bundles.

## KEY ROUTES

| Route | Purpose |
|-------|---------|
| /dashboard | Overview — device health scores, alerts, client summary |
| /clients | Client list — status, last seen, active alerts |
| /diagnostics | Diagnostic snapshots — per-device detail and trends |
| /notifications | System alerts, escalations, automated intervention log |

## ENVIRONMENT VARIABLES (Vercel)

```
NEXT_PUBLIC_API_URL=https://api.zasupport.com
NEXT_PUBLIC_API_KEY=<agent auth token>
DASHBOARD_PASSWORD=<session password — activates login middleware>
```

## FILE STRUCTURE

```
app/
  (dashboard)/         ← authenticated route group
    dashboard/         ← overview page
    clients/           ← client list + detail
    diagnostics/       ← diagnostic snapshots
    notifications/     ← alerts + interventions
  api/                 ← Next.js route handlers (proxy to backend)
  layout.tsx           ← root layout
  page.tsx             ← redirect to /dashboard
components/
  ui/                  ← shadcn/ui components (never edit directly)
  dashboard/           ← dashboard-specific components
lib/
  api.ts               ← typed fetch wrappers for api.zasupport.com
  utils.ts             ← shared utilities (cn, formatDate, etc.)
middleware.ts          ← session auth gate (DASHBOARD_PASSWORD)
```

## CODING CONVENTIONS

- Server components by default — only use "use client" when required (event handlers, state).
- All API calls go through lib/api.ts typed wrappers — never raw fetch in components.
- Date format: DD/MM/YYYY (never MM/DD/YYYY).
- Currency: R with space (R 4,499 — never $, never R4499).
- Colours: TEAL #27504D | GREEN #0FEA7A | ZA_GREEN #1B6B4A.
- shadcn/ui components only — no additional UI libraries without approval.
- Tailwind v4 — use CSS variable tokens, not arbitrary values where possible.

## POPIA COMPLIANCE

- No client PII rendered in browser console logs.
- No client data cached in localStorage or sessionStorage.
- All diagnostic data read-only — dashboard never writes to client records.

## 80/20 AUTOMATION MANDATE

```
Task clear and scoped?
├── YES → Build immediately. No questions.
└── NO  → Ask ONE clarifying question only. Then build.

New page needed?
├── YES → Scaffold in app/(dashboard)/<name>/page.tsx — copy nearest similar page.
└── NO  → Add to existing page as a new section/component.

New API data needed?
├── YES → Add typed fetch wrapper in lib/api.ts first, then consume in component.
└── NO  → Reuse existing wrapper.
```

### NEVER DO
- Never add a new UI library when a shadcn/ui component covers the use case.
- Never fetch data in a client component when a server component works.
- Never hardcode API URLs — always use NEXT_PUBLIC_API_URL.
- Never ask "should I proceed?" — just proceed.
- Never explain a plan for more than 3 lines before executing it.

### ALWAYS DO
- Always use server components for data fetching (RSC pattern).
- Always type API responses — no `any` in lib/api.ts.
- Always use the `cn()` utility from lib/utils.ts for conditional classNames.
- Always run `npm run build` locally to verify no TypeScript errors before shipping.
- Always check /health on api.zasupport.com before diagnosing data issues.

## §3 ANTI-PATTERNS (NEVER DO)

- NEVER write feature logic outside of the component or lib/ layer.
- NEVER create a new page without adding it to the route group structure.
- NEVER commit without reading this file first this session.
- NEVER create this project without: INSTRUCTIONS.md | PROJECT_MANIFEST.json | deploy.sh | render.yaml (N/A for Vercel) | .env.example.

## REPO

za-support-dashboard on Vercel (main branch)
Live: https://dashboard.zasupport.com
Backend: https://api.zasupport.com

# §100 added 13/03/2026: Task Classification — No False Manual Gates
