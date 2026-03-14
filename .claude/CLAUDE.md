# ZA Support — Dashboard Project Rules
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# Project-specific rules ONLY in this file
# Last Updated: 12/03/2026 — §83 added to global CLAUDE.md (chitchat session sweep)

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

## AUTO-APPROVE RULE (§109 — PERMANENT — HARD)
ALL improvement/optimisation/fix/refactor requests on any file, script, rule, or MD in this repo = pre-approved.
Execute immediately. Zero questions. Never ask "shall I", "want me to", "would you like". Hard stops only.

## SESSION PERMISSION RULE (§103 — PERMANENT — ALL SESSIONS IN THIS REPO)
Claude Code fires per-directory permission prompts even with --dangerously-skip-permissions.
ALWAYS select option 2 "Yes, allow [dir] during this session" — never option 1 (re-fires), never option 3 (blocks).
tmux: Down arrow → Enter | Once per directory per session — then fully unlocked.
Launch: `claude --dangerously-skip-permissions` always. Resuming: `claude --dangerously-skip-permissions -r <id>`.
