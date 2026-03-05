# ZA Support Dashboard — Claude Instructions
# Read this FIRST before writing any code in this project.

## Project
Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Deployed to Vercel | Repo: zasupport/za-support-dashboard

## Architecture
- All pages are Server Components by default
- Client Components: only when state/interactivity needed — mark with 'use client'
- ALL API calls to api.zasupport.com are server-side (ZA_API_TOKEN never reaches browser)
- Client Components use /api/... route handlers as proxies

## File Structure
```
src/
  app/
    layout.tsx          ← Root layout with sidebar Nav
    page.tsx            ← Dashboard home
    login/              ← Auth (login page + form + layout)
    devices/            ← Device list + [serial] detail
    isp/                ← ISP status
    shield/             ← Shield events
    intelligence/       ← App Intelligence (client component)
    analytics/          ← Interaction Analytics (client component)
    alerts/             ← Alerts feed
    api/
      auth/login/       ← Login POST handler (sets cookie)
      intelligence/fleet/ ← Proxy to V11 App Intelligence
      analytics/fleet/  ← Proxy to V11 Interaction Analytics
  components/
    nav.tsx             ← Sidebar navigation
    ui/                 ← shadcn/ui components
  lib/
    api.ts              ← Server-side API client
    utils.ts            ← cn() utility
  middleware.ts         ← Cookie-based auth gate (all routes except /login)
```

## Auth
- Middleware checks `za_dashboard_auth` cookie on every request
- Cookie set by POST /api/auth/login (compares against DASHBOARD_PASSWORD env var)
- 8-hour session, httpOnly, secure in prod

## Env Vars
```
ZA_API_URL=https://api.zasupport.com     # V11 backend base URL
ZA_API_TOKEN=<bearer token>              # Agent auth token — NEVER NEXT_PUBLIC_
DASHBOARD_PASSWORD=<password>            # Dashboard login password
```

## Adding New Pages
1. Create src/app/{route}/page.tsx as async Server Component
2. Import from @/lib/api for data fetching
3. Add link to src/components/nav.tsx
4. If client interactivity needed: split into page.tsx (server) + client.tsx (client)

## Adding New API Proxies
1. Create src/app/api/{route}/route.ts
2. Read ZA_API_URL and ZA_API_TOKEN from process.env
3. Forward request to V11, return response
4. Use in client components via fetch('/api/...')

## Deployment (Vercel)
1. `vercel login` (browser OAuth)
2. `vercel --prod` from this directory
3. Set env vars in Vercel dashboard: ZA_API_URL, ZA_API_TOKEN, DASHBOARD_PASSWORD
4. Auto-deploys on push to main (once connected via Vercel dashboard)
