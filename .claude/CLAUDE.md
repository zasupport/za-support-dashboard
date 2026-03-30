# ZA Support — Dashboard Project Rules (.claude/CLAUDE.md)
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# This file: dashboard-specific rules ONLY
# Last Updated: 27/03/2026 — compressed, global duplicates removed

## PROJECT IDENTITY
- Repo: zasupport/za-support-dashboard
- Path: /Users/courtneybentley/Developer/za-support-dashboard/
- Deploy: Vercel — dashboard.zasupport.com
- Stack: Next.js 14 + Tailwind CSS + shadcn/ui
- API: https://api.zasupport.com (Health Check v11 backend)

## GLOBAL RULES (auto-loaded — do NOT duplicate)
# §176 §174 §173 §155 §109 §103 §122 §123 §124 §86 §125 §127 §128 §129
# §130 §136 §153 §92 §180 §181 §145-§151 §COMPRESS §BASH → ~/.claude/CLAUDE.md

## DASHBOARD COMPONENT STANDARDS
- shadcn/ui components FIRST — never build from scratch what shadcn covers
- All pages in app/ directory (Next.js App Router)
- API calls via /api/ route handlers — never call backend directly from client components
- TypeScript strict mode — tsc --noEmit must pass before any commit
- Mobile-first design — all views must be usable on iPhone
- Dark/light mode via Tailwind dark: prefix
- No direct backend DB access from dashboard — API only

## BEFORE COMMITTING
- Run: `npm run build` — must succeed with 0 errors
- Run: `npx tsc --noEmit` — must pass with 0 type errors
- No console.log() in production code

## KEY DIRECTORIES
- app/ — Next.js App Router pages and layouts
- components/ — Reusable UI components
- lib/ — Utilities, API helpers
- app/api/ — Route handlers (server-side API calls to backend)

## GLOBAL RULES ACTIVE (pointers only)
# §129|§131|§132|§133|§134 → ~/.claude/CLAUDE.md
# §187 LOCAL AUTOMATION FIRST → global CLAUDE.md (auto-loaded)
# §188 CLIENT MACHINE APPROVAL → global CLAUDE.md (auto-loaded)
