# ZA Support Dashboard
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# Project-specific config, structure, auth, features ONLY | Last Updated: 20/04/2026 (compression pass)

# Auto-loaded from global: §64/§73/§92/§109/§129-§134/§161/§173/§176/§178-§181/§187-§192/§200/§201/§203-§210/§216/§219/§221/§222/§229/§230/§234/§239-§248/§254-§263/§265/§267-§269/§BASH/§COMPRESS

# Stack: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts
# Backend: https://api.zasupport.com | Deploy: Vercel | Repo: https://github.com/zasupport/za-support-dashboard

---

## Structure

```
src/app/                    <- Next.js App Router pages
  page.tsx                  <- Dashboard home (summary cards)
  devices/page.tsx          <- Device list
  devices/[serial]/page.tsx <- Device detail + raw diagnostic payload
  isp/page.tsx              <- ISP status (13 SA ISPs)
  shield/page.tsx           <- Shield events feed
  intelligence/             <- App Intelligence fleet view
  analytics/                <- Interaction Analytics fleet view
  alerts/page.tsx           <- Alerts feed
  api/                      <- Route handlers (server-side API proxies)
    intelligence/fleet/route.ts
    analytics/fleet/route.ts
src/components/
  nav.tsx                   <- Sidebar navigation
  ui/                       <- shadcn/ui components
src/lib/
  api.ts                    <- Server-side API client
  utils.ts                  <- cn() utility
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
2. Connect to Vercel -> import repo
3. Add env vars: ZA_API_URL, ZA_API_TOKEN
4. Deploy — auto-deploys on push to main

---

## What is done

- [x] Dashboard home — summary cards + activity feed
- [x] Morning Brief — client health grid with risk, last scan, open tasks/jobs
- [x] Clients page — list with search + filter by status
- [x] Client detail — contact, concerns, business info, health grade, PDF download
- [x] Client notes — sticky internal notes (add/delete)
- [x] Client onboarding task checklist — interactive tick-off
- [x] Client status updater — change status (new/active/sla/inactive)
- [x] Site visit brief — pre-visit context: devices, open tasks, check-ins, jobs
- [x] Workshop board — Kanban job cards with status cycling
- [x] Workshop job detail — full view with status history, line items, notes
- [x] WorkshopNewJob — inline creation form (client dropdown + title + priority)
- [x] CreateJobButton on client and device detail pages
- [x] Devices page — list + per-device detail with diagnostics + trend charts
- [x] Device snapshot viewer — full 7-page payload from historical snapshot
- [x] ISP Status — 13 SA ISPs with status badges
- [x] Shield Events — 48h feed with severity badges
- [x] App Intelligence — fleet health by client_id
- [x] Interaction Analytics — frustration scores fleet view + timeline chart
- [x] Alerts page — alert feed
- [x] Vault — credential management
- [x] Breach Scanner — scan sessions and findings
- [x] Forensics — investigation management
- [x] Reports — PDF generation per client
- [x] Auto-refresh — all pages auto-refresh at configurable intervals
- [x] Global search — client + device search in nav sidebar
- [x] Dark theme throughout (slate-800/900/950)
- [x] Server-side auth (bearer token never exposed to browser)
- [x] Login + full session auth — middleware, cookie, login form, logout
- [x] Customer Guides — list, create, send, delete, category filter, tags
- [x] Scout Installer page — /installer
- [x] ROI widget + trend chart on client page
- [x] UpsellPanel on client page
- [x] /api/lifecycle/radar proxy route
- [x] Automated Interventions page (/interventions) with 24h/7d/30d filter

## What is pending

- [ ] Lifecycle records need seeding from Scout diagnostic uploads (auto on next Scout run)
- [ ] Sales recommendations need generating from diagnostic findings (backend ROI engine)
# §187 LOCAL AUTOMATION → global CLAUDE.md (auto-loaded)
# §188 CLIENT MACHINE APPROVAL → global CLAUDE.md (auto-loaded)
# §189 RULES SYNC → global CLAUDE.md (auto-loaded)
# §187 LOCAL FIRST → global CLAUDE.md (auto-loaded)
