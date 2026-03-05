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

- [x] Dashboard home — summary cards (devices, ISP outages, shield events, alerts)
- [x] Devices page — list + per-device detail with raw diagnostic payload
- [x] ISP Status page — all 13 SA ISPs with status badges
- [x] Shield Events page — 48h feed with severity badges
- [x] App Intelligence page — fleet health by client_id
- [x] Interaction Analytics page — frustration scores fleet view
- [x] Alerts page — alert feed
- [x] Dark theme throughout (slate-800/900/950)
- [x] Server-side auth (bearer token never exposed to browser)

## What is pending

- [ ] Authentication (login page, session) — currently no auth, add before Vercel deploy
- [ ] Diagnostics detail viewer — formatted sections instead of raw JSON
- [ ] Charts — Recharts graphs for resource trends, frustration timeline
- [ ] Real-time refresh — polling or SSE for shield events / alerts
