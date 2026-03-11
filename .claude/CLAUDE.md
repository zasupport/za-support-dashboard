# ZA Support — Dashboard Project Rules
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# Project-specific rules ONLY in this file
# Last Updated: 10/03/2026

## PROJECT IDENTITY
- Repo: zasupport/za-support-dashboard
- Path: /Users/courtneybentley/Developer/za-support-dashboard/
- Deploy: Vercel — dashboard.zasupport.com
- Stack: Next.js 14 + Tailwind CSS + shadcn/ui
- API: https://api.zasupport.com (Health Check v11 backend)

## PROJECT-SPECIFIC RULES

### Component Standards
- shadcn/ui components FIRST — never build from scratch what shadcn covers
- All pages in app/ directory (Next.js App Router)
- API calls via /api/ route handlers — never call backend directly from client components
- TypeScript strict mode — tsc --noEmit must pass before any commit

### Before Committing
- Run: `npm run build` — must succeed with 0 errors
- Run: `npx tsc --noEmit` — must pass with 0 type errors
- No console.log() in production code

### Key Directories
- app/ — Next.js App Router pages and layouts
- components/ — Reusable UI components
- lib/ — Utilities, API helpers
- app/api/ — Route handlers (server-side API calls to backend)

## PROJECT-SPECIFIC NOTES
- Mobile-first design — all views must be usable on iPhone
- Dark/light mode via Tailwind dark: prefix
- No direct backend DB access from dashboard — API only
