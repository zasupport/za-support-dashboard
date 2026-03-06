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

- [ ] DASHBOARD_PASSWORD env var not set on Vercel → session guard inactive (set in Vercel dashboard)
- [ ] Charts — Recharts resource trend graphs on devices page (TrendCharts.tsx exists, needs wiring)
