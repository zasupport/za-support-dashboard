# ZA Support — Dashboard Project Rules (.claude/CLAUDE.md)
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# Project-specific rules ONLY | Last Updated: 20/04/2026 (compression pass)

# Auto-loaded from global: §86/§92/§103/§109/§122-§134/§136/§145-§153/§155/§173/§174/§176/§180/§181/§187-§192/§200/§201/§203-§210/§219-§222/§229/§230/§234/§239-§242/§247/§248/§251/§254-§263/§265/§267-§269/§278/§284/§BASH/§COMPRESS

## PROJECT IDENTITY
- Repo: zasupport/za-support-dashboard
- Path: /Users/courtneybentley/Developer/za-support-dashboard/
- Deploy: Vercel — dashboard.zasupport.com
- Stack: Next.js 14 + Tailwind CSS + shadcn/ui
- API: https://api.zasupport.com (Health Check v11 backend)

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

# §220 RESEARCH-FIRST BLOG PIPELINE → global CLAUDE.md (auto-loaded)
# §187 LOCAL AUTOMATION → global CLAUDE.md (auto-loaded)
# §188 CLIENT MACHINE APPROVAL → global CLAUDE.md (auto-loaded)
# §189 RULES SYNC → global CLAUDE.md (auto-loaded)
