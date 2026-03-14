# ZA Support Dashboard
# Stack: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts
# Backend: https://api.zasupport.com
# Deploy: Vercel
# Repo: https://github.com/zasupport/za-support-dashboard

---

## Structure

```
src/app/                    ← Next.js App Router pages
  page.tsx                  ← Dashboard home (summary cards)
  devices/page.tsx          ← Device list
  devices/[serial]/page.tsx ← Device detail + raw diagnostic payload
  isp/page.tsx              ← ISP status (13 SA ISPs)
  shield/page.tsx           ← Shield events feed
  intelligence/             ← App Intelligence fleet view
  analytics/                ← Interaction Analytics fleet view
  alerts/page.tsx           ← Alerts feed
  api/                      ← Route handlers (server-side API proxies)
    intelligence/fleet/route.ts
    analytics/fleet/route.ts
src/components/
  nav.tsx                   ← Sidebar navigation
  ui/                       ← shadcn/ui components
src/lib/
  api.ts                    ← Server-side API client
  utils.ts                  ← cn() utility
```

---

## Auth

All API calls are server-side only. `ZA_API_TOKEN` env var — never `NEXT_PUBLIC_`.
Server Components call `src/lib/api.ts` directly.
Client Components use `/api/...` route handlers (proxied, token never reaches browser).

---

## Env vars

### .env.local (dev) / Vercel dashboard (prod)
```
ZA_API_URL=https://api.zasupport.com
ZA_API_TOKEN=<agent bearer token>
```

---

## Deploy to Vercel

1. Push repo to GitHub: `gh repo create zasupport/za-support-dashboard --public --source=. --push`
2. Connect to Vercel → import repo
3. Add env vars: ZA_API_URL, ZA_API_TOKEN
4. Deploy — auto-deploys on push to main

---

## What is done

- [x] Dashboard home — summary cards + activity feed (devices, ISP outages, shield events, alerts)
- [x] Morning Brief page — client health grid with risk, last scan, open tasks/jobs, urgent flag
- [x] Clients page — list with search + filter by status
- [x] Client detail page — contact, concerns, business info, health grade, CyberPulse PDF download
- [x] Client notes — sticky internal notes (add/delete) on client profiles
- [x] Client onboarding task checklist — interactive tick-off with status cycling
- [x] Client status updater — change status (new/active/sla/inactive) from dashboard
- [x] Site visit brief page — pre-visit context: devices + last snapshot, open tasks, check-ins, jobs
- [x] Workshop board — Kanban-style job cards with status cycling (open→in_progress→done)
- [x] Workshop job detail page — full job view with status history, line items, notes
- [x] WorkshopNewJob — inline job creation form (client dropdown + title + priority)
- [x] CreateJobButton on client and device detail pages (pre-fills client_id/serial)
- [x] Devices page — list + per-device detail with diagnostic payload + trend charts
- [x] Device snapshot viewer — full 7-page payload from a specific historical snapshot
- [x] ISP Status page — all 13 SA ISPs with status badges
- [x] Shield Events page — 48h feed with severity badges
- [x] App Intelligence page — fleet health by client_id
- [x] Interaction Analytics page — frustration scores fleet view
- [x] Alerts page — alert feed
- [x] Vault page — credential management
- [x] Breach Scanner page — scan sessions and findings
- [x] Forensics page — investigation management
- [x] Reports page — CyberPulse PDF generation per client
- [x] Auto-refresh component — all pages auto-refresh server data at configurable intervals
- [x] Global search — client + device search in nav sidebar
- [x] Dark theme throughout (slate-800/900/950)
- [x] Server-side auth (bearer token never exposed to browser)
- [x] Login page + full session auth — middleware, cookie, login form, logout route + nav button
- [x] Customer Guides page — list, create, send to client, delete, category filter, tag display
- [x] Interaction Analytics — frustration timeline chart (Recharts AreaChart, per device, 30d)
- [x] Scout Installer page — /installer

## What is pending

- [x] DASHBOARD_PASSWORD set on Vercel (confirmed 08/03/2026)
- [x] TrendCharts wired on device serial page
- [x] ROI widget + trend chart on client page
- [x] UpsellPanel on client page — surfaces sales recommendations with status cycling
- [x] /api/lifecycle/radar proxy route (feeds Upgrade Radar page)
- [x] Automated Interventions page (/interventions) with 24h/7d/30d filter
- [ ] Lifecycle records need seeding from Scout diagnostic uploads (happens automatically on next Scout run per client)
- [ ] Sales recommendations need generating from diagnostic findings (backend ROI engine feeds this)

## AGENT RULE (PERMANENT — 13/03/2026)
- Minimum 20 concurrent agents per non-trivial task (hard floor, no ceiling)
- Every build, verify, deploy, investigation = 20+ agents launched simultaneously
- See global ~/.claude/CLAUDE.md §73.5-§73.6 for full rules

## PKG PUBLISH RULE (PERMANENT — §94 — 13/03/2026)
- Every PKG build → publish to /api/v1/agent/pkg/latest + OTA broadcast immediately
- Never hold a built PKG — §94.1 auto-execute rule (no asking)

## §109: AUTO-APPROVE IMPROVEMENTS (PERMANENT — HARD)
ANY request to improve/optimise/upgrade/enhance/fix/refactor ANY file, script, pipeline, page, rule, or process = pre-approved. Execute immediately, zero questions.
∅ "Shall I save this?" | ∅ "Want me to update?" | ∅ "Would you like me to?" | ∅ "Should I?" — ALL BANNED on improvement requests.
Applies to: all files in this repo, CLAUDE.md updates, memory files, rules propagation, script improvements.
Hard stops only: DROP TABLE prod | delete client data | force push main | new paid >R500/mo
→ memory/feedback_auto_approve_improvements.md
