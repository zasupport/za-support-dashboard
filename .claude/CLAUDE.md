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

## AUTO-EXECUTE RULE (§122 — PERMANENT — HARD)
Before closing ANY chat or session: execute ALL remaining tasks (build/fix/commit/deploy/verify), write ALL learnings to MEMORY.md + memory/*.md, sync new permanent rules to all repo CLAUDE.md files.
BANNED: stopping mid-task | leaving items for next session without executing | reporting without acting | "shall I continue?" when more remains.

## CI/DEPLOY ERROR RULE (§BUILD-FIRST — PERMANENT — HARD)
ON ANY CI failure, GitHub Actions failure, Vercel deploy failure, or build error:
FIX IT IMMEDIATELY — before any other task, before any new feature, before any other response.
(1) Pull exact error from `gh run list` + `gh run view --log-failed` (2) Fix root cause in code (3) Commit + push (4) Verify CI passes (5) THEN continue prior task.
∅ "I'll fix this later" | ∅ move on with failure unresolved | ∅ report without fixing
Email signals: subject:"Run failed" | subject:"Failed production deployment" — treat as P0 interrupts.

## CI/DEPLOY ERROR RULE (§123 — PERMANENT — HARD — P0)
ON ANY CI failure, GitHub Actions failure, Vercel deploy failure, Render crash, or build error:
FIX IMMEDIATELY — before any other task, before any new feature, before continuing anything.
(1) gh run list --repo <repo> --limit 3 → identify (2) gh run view <id> --log-failed → get errors (3) Fix in code (4) Commit+push (5) Verify green (6) Resume prior task.
∅ "I will fix this later" | ∅ proceed with broken CI | ∅ report without fixing
Monitor: ~/bin/za-ci-monitor.sh (every 5min) | Alert: ~/Desktop/ZA-CI-FAILURE-*.md → fix same response.

## AUTOMATION/MONITORING TOOL REQUESTS (§124 — PERMANENT — HARD)
Requests to build any monitoring, alerting, watchdog, automation, or CI tool = pre-approved. Build immediately, zero questions. ∅ ask, ∅ confirm.

## AGENT COMPLIANCE — SELF-ENFORCEMENT (§125 — PERMANENT — HARD)
MINIMUM 15 AGENTS ALWAYS — PRE-APPROVED — NO CEILING — ∅sequential in main context — see ~/.claude/CLAUDE.md §73
Before ANY non-trivial task: count running agents. If <20 → spawn to 20 immediately.
Tasks >90s: spawn 10 more agents instantly — no exception.
Sequential steps BANNED. Every independent action = its own agent.
∅ serial DB query → read → fix → test. Run ALL simultaneously.
