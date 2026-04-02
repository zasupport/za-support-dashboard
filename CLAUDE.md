# ZA Support Dashboard

# §201 WHATSAPP DEFAULT NUMBER (HARD — 30/03/2026):n# When sending ANY WhatsApp draft or message and the client's number is unknown → use Courtney's number: 27790539964 (079 053 9964)n# ∅ wait for another number | ∅ block on "pending SIM" | ∅ say "number needed first"n# Courtney's number = default send-to for all WA drafts until client number is confirmedn# Helper: ~/bin/za-whatsapp-send.sh 27790539964 "[message]"
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# This file: dashboard-specific config, structure, auth, features
# Last Updated: 27/03/2026 — compressed, global duplicates removed

# GLOBAL RULES (auto-loaded — do NOT duplicate)
# §178 §179 §173 §92 §161 §109 §130 §176 §180 §BASH §COMPRESS → ~/.claude/CLAUDE.md
# §129|§131|§132|§133|§134 → ~/.claude/CLAUDE.md
# §187 LOCAL AUTOMATION FIRST → global CLAUDE.md (auto-loaded)

# Stack: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts
# Backend: https://api.zasupport.com
# Deploy: Vercel | Repo: https://github.com/zasupport/za-support-dashboard

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
# §188 CLIENT MACHINE APPROVAL → global CLAUDE.md (auto-loaded)
# §189 RULES SYNC → global CLAUDE.md (auto-loaded)
# §191 HR ZOHO AUTO-EXCHANGE → global CLAUDE.md (auto-loaded)
# §192 HR PREFIX → global CLAUDE.md (auto-loaded)
# §200 ROOT CAUSE DISCLOSURE → global CLAUDE.md (auto-loaded)

# §203 IP PROTECTION (HARD — 30/03/2026): token gate + copy lock + noindex + generic title on ALL demos/previews | bare URL = black screen | CSS user-select:none + JS block copy/F12/Ctrl+U | robots.txt Disallow:/ in every demo repo

# §204 URL HASHING POPIA (HARD — 30/03/2026): ALL demo/preview URL segments hashed sha256[:8] | ∅ client name ∅ descriptive words in repo/path/filename | mapping in memory/api-keys.md only

# §205 CLIENT-FACING DOCS BY DEFAULT (HARD — 30/03/2026): ALL docs/PDFs/reports = client-facing unless Courtney says "internal" | ∅ internal headers on client PDFs | written FOR the client

# §206 NO AI DIVIDERS (HARD — 30/03/2026): ∅ "---" ∅ "***" ∅ horizontal rules in any doc/email/WA/PDF | use white space + headings | repetitive parallel bullet structures also banned

# §207 HTML EMAIL FORMATTING (HARD — 30/03/2026): ALL automated emails must use HTML — ∅ plain text ∅ content= property | use --html flag on za-outlook-send.sh | <p> per paragraph <h3> for sections | each item on own line

# §208 AUTO-REGENERATE ON RULE CHANGE (HARD — 30/03/2026): when any formatting/doc rule is updated → automatically regenerate ALL affected documents same response | ∅ apply rule to future docs only | ∅ leave existing docs stale | affected docs = any PDF/email/WA template that references the changed rule

# §209 GOOGLE FOLDER (HARD — 30/03/2026): ALL Google/SEO/ranking/analytics content → ~/Desktop/Claude/Google/ | Sub-folders: SEO|SEO-Intelligence|Lighthouse|PageSpeed|Analytics|Search-Console|Nightly-Tests|Competitor-Intel | ∅ create SEO folders outside Google/
# §210 NO SALES WORDING (HARD — 30/03/2026): ∅ motivational/inspirational taglines in docs/PDFs/emails/proposals | ∅ "deserves" ∅ "works as hard as" | factual + professional tone only

# §216 AUTO-EXECUTE VIA SKILL/MD/INSTRUCTION (HARD — 31/03/2026): ∅ "Paste this in Terminal" ∅ copy-paste executable blocks | ANY auto-executable → SKILL.md OR ~/bin/za-*.sh script OR LaunchAgent | exceptions: interactive OAuth, destructive actions needing human confirm

# §219 WHO NOT HOW (HARD — 02/04/2026): ∅ "How do I do X?" → "Who is the best Who?" | Courtney=WHAT+WHY+approval | Claude=primary technical Who for ALL Hows | Impact Filter: WHAT+WHY+best/worst result+success checklist before any new goal | ∅ present How options — pick+execute | STUCK=find better Who ∅ escalate to Courtney → global CLAUDE.md (full detail)
