# ZA Support — Dashboard Project Rules (.claude/CLAUDE.md)

# §201 WHATSAPP DEFAULT NUMBER (HARD — 30/03/2026):n# When sending ANY WhatsApp draft or message and the client's number is unknown → use Courtney's number: 27790539964 (079 053 9964)n# ∅ wait for another number | ∅ block on "pending SIM" | ∅ say "number needed first"n# Courtney's number = default send-to for all WA drafts until client number is confirmedn# Helper: ~/bin/za-whatsapp-send.sh 27790539964 "[message]"
# Global rules auto-loaded from: ~/.claude/CLAUDE.md (do not duplicate here)
# This file: dashboard-specific rules ONLY
# Last Updated: 27/03/2026 — compressed, global duplicates removed

## PROJECT IDENTITY
- Repo: zasupport/za-support-dashboard
- Path: /Users/courtneybentley/Developer/za-support-dashboard/
- Deploy: Vercel — dashboard.zasupport.com
- Stack: Next.js 14 + Tailwind CSS + shadcn/ui
- API: https://api.zasupport.com (Health Check v11 backend)

## GLOBAL RULES (auto-loaded — do NOT duplicate)
# §176 §174 §173 §155 §109 §103 §122 §123 §124 §86 §125 §127 §128 §129
# §130 §136 §153 §92 §180 §181 §145-§151 §COMPRESS §BASH → ~/.claude/CLAUDE.md

## DASHBOARD COMPONENT STANDARDS
- shadcn/ui components FIRST — never build from scratch what shadcn covers
- All pages in app/ directory (Next.js App Router)
- API calls via /api/ route handlers — never call backend directly from client components
- TypeScript strict mode — tsc --noEmit must pass before any commit
- Mobile-first design — all views must be usable on iPhone
- Dark/light mode via Tailwind dark: prefix
- No direct backend DB access from dashboard — API only

## BEFORE COMMITTING
- Run: `npm run build` — must succeed with 0 errors
- Run: `npx tsc --noEmit` — must pass with 0 type errors
- No console.log() in production code

## KEY DIRECTORIES
- app/ — Next.js App Router pages and layouts
- components/ — Reusable UI components
- lib/ — Utilities, API helpers
- app/api/ — Route handlers (server-side API calls to backend)

## GLOBAL RULES ACTIVE (pointers only)
# §129|§131|§132|§133|§134 → ~/.claude/CLAUDE.md
# §187 LOCAL AUTOMATION FIRST → global CLAUDE.md (auto-loaded)
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

# §219 WHO NOT HOW (HARD — 02/04/2026): ∅ "How do I do X?" → "Who is the best Who?" | Courtney=WHAT+WHY+approval | Claude=primary technical Who for ALL Hows | Impact Filter: WHAT+WHY+best/worst result+success checklist before any new goal | ∅ present How options — pick+execute | STUCK=find better Who ∅ escalate to Courtney → global CLAUDE.md (full detail)
# §220 RESEARCH-FIRST BLOG PIPELINE → global CLAUDE.md (auto-loaded)
# §229 BLOG VELOCITY 8/DAY (HARD — 07/04/2026) → global CLAUDE.md (auto-loaded)
# §230 OPUS BLOG OWNERSHIP → global CLAUDE.md (auto-loaded)
# §221 GMB MEDIA SYNC → global CLAUDE.md (auto-loaded)
# §222 CLAUDE OPUS TERMINAL ONLY → global CLAUDE.md (auto-loaded)
# §234 CLIENT-FACING PDF FORMAT (HARD — 07/04/2026) → global CLAUDE.md (auto-loaded)
# §239 VEHICLE BRANDING MOCKUP (HARD — 08/04/2026) AUTO-EXECUTE → ~/Developer/za-support-imggen/ | /vehicle-branding | global CLAUDE.md (auto-loaded)
# §240 STATUS VERIFICATION WITH REAL DATA (HARD — 08/04/2026) → global CLAUDE.md (auto-loaded)
# §241 UNCERTAIN=TEST→SELF-HEAL→RETEST→LOOP (HARD — 08/04/2026) → global CLAUDE.md (auto-loaded)
# §240 MOCKUP OPUS PIPELINE + AUTO-OPEN (HARD — 08/04/2026) → Creative.MD + Opus refine + auto-open | global CLAUDE.md (auto-loaded)
# §241 TERMINAL OPUS LAUNCHER (HARD — 08/04/2026) → O = new Terminal CLI + claude-opus-4-6 | ∅ browser ∅ claude.ai | global CLAUDE.md (auto-loaded)
# §242 OPUS = NEW TERMINAL WINDOW (HARD — 08/04/2026): ANY Opus request → new Terminal CLI | ∅ claude.ai ∅ browser ∅ paste | global CLAUDE.md (auto-loaded)
# §247 COMPLETION SELF-CHECK — CC/CI/PORTABLE.MD (HARD — 08/04/2026): before marking ANY output complete answer "How do I know this completed successfully?" | CC=run+stdout | CI=gh run view+exit 0 | Portable.MD=grep key section+propagated | global CLAUDE.md (auto-loaded)
# §248 CONTINUOUS LEARNING (HARD — 08/04/2026): after every task answer WHAT learned + WHAT better + WHY success/failure + WHAT to replicate → propagate to all .md + intelligence engine | global CLAUDE.md (auto-loaded)
# §251 PDF HEADING ORPHAN PREVENTION (HARD — 08/04/2026): ALL ReportLab PDF section/subheading ParagraphStyle MUST have keepWithNext=True | short sections wrap in KeepTogether([heading, body]) | ∅ orphaned headings | extends §234 | global CLAUDE.md (auto-loaded)

# §254 MAC MODEL ID SKILL: /mac-model-id — load before stating ANY Mac hardware spec/upgrade/macOS compat | ∅ guess from year alone | SKILL: ~/.claude/skills/mac-model-id/SKILL.md

# §255 HARDWARE RESEARCH VERIFICATION: /hardware-research — min 2 sources + real-world confirmation before ANY hardware/software compat claim | ∅ answer from training data alone

# §256 IFIXIT REPAIR GUIDE LOOKUP: /ifixit-repair-guide — search iFixit for exact model+component guide, verify A-number, save to Knowledge Centre | ∅ generic model without year

# §261 RESEARCH-FIRST PROJECT CREATION: ANY new project → /project-research-engine auto-loads FIRST | TWO ENGINES: generic(one-time) + living(daily) | ∅ code before research
# §260 CONTINUE = RESUME, NOT RESTART: "continue"/"finish"/"complete the above" = resume signal | ∅ restart ∅ recap | extends §231
# §259 WHATSAPP SKILL AUTO-ACTIVATION: NLP trigger → auto-load WhatsApp skills (7 total) | za-whatsapp-skill-verify.sh
# §257 CROSS-PLATFORM CONTEXT SYNC: portable.md every 2min → iCloud+API+local | za-portable-context-sync.sh | com.zasupport.portablesync (120s)

# §262 END-TO-END PROOF GATE (HARD — 11/04/2026): EVERY build/update/pipeline MUST prove with real data that every stage works end-to-end | ∅ done without proof | extends §92+§233+§240+§247 | global CLAUDE.md (full detail)

# §263 WEEKLY KEYWORD STRATEGY (HARD — 11/04/2026): Saturday XLSX + daily reminders until approved | global CLAUDE.md (full detail)

# §269 PROPRIETARY TOOL CONCEALMENT (HARD — 13/04/2026): ∅ ANY reference to tools, technologies, frameworks, platforms, methods, processes in ANY public output | FULL SPEC: ~/.claude/rules/269-proprietary-tool-concealment.md | supersedes §268 | extends §203+§204+§205+§252 | global CLAUDE.md (full detail)
# §268 TECH STACK CONCEALMENT (HARD — 13/04/2026): ∅ proprietary technology identifiers (logos, favicons, SVGs, meta tags, boilerplate) visible on ANY public-facing property | Vercel/Next.js/Render/Sanity branding = competitive intelligence leak | remove on sight | replace with ZA Support branding | extends §203+§204 | global CLAUDE.md (full detail)
# §265 AUTO-COMPLETE BLOG+WEBSITE WORK (HARD — 12/04/2026): auto-execute blog/website tasks needing no input | global CLAUDE.md (full detail)

# §267 COMPLETE ALL PENDING BEFORE SESSION END (HARD — 12/04/2026): ∅ end with unfinished tasks | verify 0 pending | Stop hook | global CLAUDE.md (full detail)
