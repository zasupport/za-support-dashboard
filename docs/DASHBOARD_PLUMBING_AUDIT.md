# Dashboard Plumbing Audit — §281 Engine 1 Research
*Created 24/04/2026 | Governed by `checklist-audit-cognitive-mode` + `comprehensive-capture-hr`*

## Question the audit answers
> "If I were a user viewing this dashboard with real data — what should I see on each section, and how does the data get there?"

## Architecture baseline

```
Browser
  └─→ dashboard.zasupport.com (Vercel, Next.js 15)
        ├─→ /api/<section>  (Next.js route handler — proxy layer)
        │     └─→ api.zasupport.com/api/v1/...  (Render FastAPI)
        │           └─→ Render Postgres `dpg-d6j7a9450q8c739ga2v0`
        │                 └─ populated by PKG 5.3.10 on client Macs via /api/v1/agent/*
        └─→ env: NEXT_PUBLIC_API_URL + ZA_API_TOKEN + ZA_API_URL
```

Auth: dashboard proxies inject `X-API-Key: ZA_API_TOKEN`. Backend accepts either `X-API-Key` or `Authorization: Bearer` (same token — `agent_auth.py`).

## Section × Endpoint matrix

Status legend — **WIRED-REAL**: live data flowing. **WIRED-EMPTY**: endpoint works, DB has no rows yet. **SHAPE-BUG**: proxy/page shape mismatch. **PROXY-404**: proxy hits wrong backend path. **MISSING**: backend endpoint not implemented. **NEEDS-UI**: UI does not render received data.

| Sidebar | Page route | Proxy route | Backend endpoint | Status | Evidence / fix |
|---|---|---|---|---|---|
| Dashboard (home) | `/` | — (server components) | `lib/api.ts` direct | WIRED-REAL | Clients 26→16 after dummy purge, Devices 13, Alerts 5 |
| Morning Brief | `/morning` | `/api/morning` | `/api/v1/clients/morning/overview` or `/api/v1/dashboard/morning-report` | NEEDS-VERIFY | Endpoints exist, verify proxy target |
| Notifications | `/notifications` | `/api/notifications` | `/api/v1/agent/notifications` (307 on flat path) | PROXY-404 | Update proxy to `/api/v1/agent/notifications` |
| Automations | `/automations` | — | unknown | MISSING | Backend endpoint likely `/api/v1/automations` — not found in OpenAPI; needs build |
| WhatsApp Inbox | `/whatsapp` | `/api/whatsapp` | unknown | MISSING | No WhatsApp endpoints in OpenAPI; separate integration |
| Tickets | `/tickets` | `/api/tickets` | 307 on flat path | PROXY-404 | Redirected — map to correct path |
| Onboarding | `/onboarding` | `/api/onboarding` | unknown | NEEDS-VERIFY | OpenAPI scan for onboarding endpoints |
| Clients | `/clients` | `/api/clients` | `/api/v1/clients` | WIRED-REAL | 16 real clients after §35-compliant purge of 10 Sample records (24/04) |
| AI Insights | `/ai-profiling` | `/api/ai-profiling` | `/api/v1/ai-profiling/*` | WIRED-EMPTY | Endpoint 200s; 4 clusters exist but named "Unknown" with blank Avg risk/Backup — needs backfill run via `Run profiling pass` button |
| Workshop | `/workshop` | — | `/api/v1/workshop/*` | WIRED-REAL | 100 jobs (5 urgent) per home dashboard |
| Job Cards | `/job-cards` | `/api/job-cards` | `/api/v1/job-cards` | NEEDS-VERIFY | Verify endpoint path |
| CyberShield | `/cybershield` | `/api/shield` | `/api/v1/shield/events` | WIRED-REAL | R5,999/mo, 2 active per home dashboard |
| Upgrade Radar | `/upgrade-radar` | `/api/upgrade-radar` | unknown | NEEDS-BUILD | Backend endpoint for lifecycle-driven upgrades; home dashboard shows "6, 5 critical" so some path works |
| Site Assessments | `/site-assessments` | `/api/site-assessments` | `/api/v1/physical-assessment/*` | PROXY-404 | Update proxy target |
| Remote Commands | `/remote-commands` | `/api/commands` | `/api/v1/agent/commands` | **SHAPE-BUG fixed 24/04** | Backend returns `{commands, count}`, page expected `{data, meta}`. Fixed in proxy |
| Unassigned (badge 6) | `/unassigned` | `/api/unassigned` | `/api/v1/agent/unassigned` | SHAPE-RISK | Backend returns `{machines:[...]}`, verify proxy |
| Devices | `/devices` | `/api/devices` | `/api/v1/devices` | WIRED-REAL | 13 devices including Courtney's Mac live-reporting |
| ISP Status | `/isp` | server-component | `/api/v1/isp/status` | **SEMANTIC-BUG fixed 24/04** | Backend `up`/`degraded`/`down`, page expected `operational`/`degraded`/`outage`. Normalized at fetch boundary |
| Activation Codes | `/activation` | `/api/activation` | `/api/v1/agent/activation-codes` | NEEDS-VERIFY | Verify page-expected shape matches proxy |

## Fix sequence (priority = user-visible impact)

### P0 — Done this session (24/04/2026)
1. **10 dummy clients purged** via POPIA s16 erasure (`(Sample)` / `@noemail.invalid` filter) — backend bug fixed first (`notification_queue.client_id` INTEGER vs string slug)
2. **ISP Status "0 operational" bug** — normalized backend `up` → UI `operational`
3. **Remote Commands "0 commands"** — fixed proxy shape `{commands, count}` → `{data, meta}`

### P1 — Next turn
4. Unassigned page shape normalization: backend `{machines: [...]}` → `{data: [...]}`
5. Notifications proxy: flat `/api/v1/notifications` → `/api/v1/agent/notifications`
6. Site Assessments proxy: map to `/api/v1/physical-assessment/*`
7. AI Insights "Unknown" clusters: trigger `Run profiling pass` OR auto-run on page load when clusters lack names/metrics

### P2 — Backend endpoint gaps (needs build)
8. Automations endpoint — no backend route yet
9. WhatsApp Inbox endpoint — no backend route yet
10. Upgrade Radar — partial (home shows count, details page likely broken)

## User-perspective walk-through (what the user should see, per section)

| Section | What the user needs | What the user sees today |
|---|---|---|
| Dashboard home | 16 clients, 13 devices, 0 outages, 5 alerts, workshop summary, CyberShield, ISP strip, ROI | All cards render; "App Health Fleet: No Phase 23 data yet" awaiting PKG telemetry backfill |
| Clients | List of 16 real clients with POPIA status, last seen, SLA state | POST-FIX: 16 real clients (was 26 with 10 Sample pollution) |
| ISP Status | 14 SA ISPs with operational / degraded / outage badges + latency | POST-FIX: correct counts (was "0 operational" despite all cards "up") |
| Remote Commands | Pending commands queue, 50 total in DB | POST-FIX: real commands list (was "0 commands found" despite 50 pending) |
| AI Insights | Named clusters with risk-profile metrics + active patterns | 4 clusters "Unknown" with blank metrics — needs profiling run |
| Unassigned | Machines not yet bound to a client (e.g. `Realname: Machd` Q7MYYN2K6N) | Badge 6 but page might show 0 — needs shape-normalization verify |
| Activation Codes | 20 active codes, can generate new, view used | Appears populated — verify shape matches |
| Workshop | Job list with status, revenue, urgency | "100 jobs, 5 urgent" in home card — depth page likely works |
| CyberShield | Active customers, monthly recurring revenue, recent shield events | "2 clients, R5,999/mo" — works |
| Devices | 13 fleet devices with last-seen, macOS, chip, RAM, storage | Works — Courtney's Mac visible with 10-min-old heartbeat |

## Non-plumbing issues surfaced

1. **Render cron `za-reddit-phase-notify-backup` exited status 1** (24/04 08:07 UTC) — not blocking; Render auto-retries. If it recurs, check logs at `dashboard.render.com/cron/crn-d712t2vgi27c73f50ne0/logs`.
2. **App Health Fleet: No Phase 23 data yet** (home card) — PKG module exists but no rows reported; likely PKG 5.3.10 emits Phase 23 sampled at lower cadence than initial enrolment.

## How this audit was run

1. `ls src/app/` to enumerate UI sections
2. `ls src/app/api/` to enumerate proxy handlers
3. OpenAPI paths pulled from `https://api.zasupport.com/openapi.json`
4. Each section's page source grep'd for `fetch(` calls
5. Each backend endpoint probed live with `curl -H "Authorization: Bearer $AGENT_AUTH_TOKEN"`
6. Response shape compared to page expectation (`json.data` / `json.commands` / `json.machines` / etc.)

---
*Engine 1 Research complete. Engine 2 Implementation in progress (3/10 items shipped). See `~/.za-hcs-research.json` for broader HCS tool research.*
