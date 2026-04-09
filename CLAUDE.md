# ZA Support Dashboard

# §201 WHATSAPP DEFAULT NUMBER (HARD — 30/03/2026):n# When sending ANY WhatsApp draft or message and the client's number is unknown → use Courtney's number: 27790539964 (079 053 9964)n# ∅ wait for another number | ∅ block on "pending SIM" | ∅ say "number needed first"n# Courtney's number = default send-to for all WA drafts until client number is confirmedn# Helper: ~/bin/za-whatsapp-send.sh 27790539964 "[message]"
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# §229 BLOG VELOCITY 8/DAY | §230 OPUS BLOG OWNERSHIP → global CLAUDE.md (auto-loaded)
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

# §221 GMB MEDIA SYNC (HARD — 06/04/2026):
# Pull all photos+videos from Google Business Profile → ~/Desktop/Claude/Google/GMB-Media/
# Auth: python3 ~/bin/za-gmb-oauth-setup.py (one-time OAuth2 consent — browser required)
# Sync: bash ~/bin/za-gmb-media-sync.sh | LaunchAgent: com.zasupport.gmbmediasync (Mon 07:00)
# Photos → /GMB-Media/photos/*.webp | Videos → /GMB-Media/videos/*.mp4
# Use GMB photos in blog posts instead of stock images (§7 Image Requirements)
# Credentials: GBP_CLIENT_ID + GBP_CLIENT_SECRET + GBP_REFRESH_TOKEN in ~/.za-keys-pending.env
# Setup prereq: enable Business Profile API at console.cloud.google.com (project: za-support-seo-202603)


# §222 CLAUDE OPUS TERMINAL ONLY (HARD — 06/04/2026):
# ALWAYS launch Claude via Terminal — ∅ web browser ∅ claude.ai
# Model lock: claude-opus-4-6 set in ~/.claude/settings.json (permanent)
# Terminal launcher: ~/Desktop/Claude Opus.app (double-click → Terminal → claude --model claude-opus-4-6)
# CLI: `claude --model claude-opus-4-6` or just `claude` (settings.json enforces Opus)
# ∅ open claude.ai in browser | ∅ use Sonnet when Opus is available | ∅ skip --model flag

# §234 CLIENT-FACING PDF FORMAT (HARD — 07/04/2026) → global CLAUDE.md (auto-loaded)
# §239 VEHICLE BRANDING MOCKUP (HARD — 08/04/2026) AUTO-EXECUTE → ~/Developer/za-support-imggen/ | /vehicle-branding | global CLAUDE.md (auto-loaded)

# §240 VERIFY STATUS WITH REAL DATA (HARD — 08/04/2026): EVERY status claim MUST be verified by executing with real data — same response | ∅ mark status without testing | ∅ ask before testing — auto-execute | Extends §233
# §240 STATUS VERIFICATION WITH REAL DATA (HARD — 08/04/2026) → global CLAUDE.md (auto-loaded)
# §241 UNCERTAIN=TEST→SELF-HEAL→RETEST→LOOP (HARD — 08/04/2026) → global CLAUDE.md (auto-loaded)

# §244 RULE = RULE + ENFORCEMENT + TEST (HARD — 08/04/2026): every new HR MUST deliver (1)rule text (2)enforcement script/LaunchAgent/hook (3)real-data test — ALL in same response | ∅ rule text alone = not implemented
# §240 MOCKUP OPUS PIPELINE + AUTO-OPEN (HARD — 08/04/2026) → Creative.MD + Opus refine + auto-open | global CLAUDE.md (auto-loaded)
# §241 TERMINAL OPUS LAUNCHER (HARD — 08/04/2026) → O = new Terminal CLI + claude-opus-4-6 | ∅ browser ∅ claude.ai | global CLAUDE.md (auto-loaded)
# §242 OPUS = NEW TERMINAL WINDOW (HARD — 08/04/2026): ANY Opus request → new Terminal CLI | ∅ claude.ai ∅ browser ∅ paste | global CLAUDE.md (auto-loaded)

# §246 GSC INTELLIGENCE FEEDBACK LOOP (HARD — 08/04/2026): GSC data every 60s → correlate git changes → learned behaviours → update .md rules | ~/bin/za-gsc-intelligence.py | com.zasupport.gscintelligence | positive=weight higher, negative=investigate
# §247 COMPLETION SELF-CHECK — CC/CI/PORTABLE.MD (HARD — 08/04/2026): before marking ANY output complete answer "How do I know this completed successfully?" | CC=run+stdout | CI=gh run view+exit 0 | Portable.MD=grep key section+propagated | global CLAUDE.md (auto-loaded)
# §248 CONTINUOUS LEARNING (HARD — 08/04/2026): after every task answer WHAT learned + WHAT better + WHY success/failure + WHAT to replicate → propagate to all .md + intelligence engine | global CLAUDE.md (auto-loaded)

# §254 MAC MODEL ID SKILL: /mac-model-id — load before stating ANY Mac hardware spec/upgrade/macOS compat | ∅ guess from year alone | SKILL: ~/.claude/skills/mac-model-id/SKILL.md

# §255 HARDWARE RESEARCH VERIFICATION: /hardware-research — min 2 sources + real-world confirmation before ANY hardware/software compat claim | ∅ answer from training data alone

# §256 IFIXIT REPAIR GUIDE LOOKUP: /ifixit-repair-guide — search iFixit for exact model+component guide, verify A-number, save to Knowledge Centre | ∅ generic model without year

# §257 CROSS-PLATFORM CONTEXT SYNC: portable.md every 2min → iCloud+API+local | za-portable-context-sync.sh | com.zasupport.portablesync (120s)
