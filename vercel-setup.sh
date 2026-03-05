#!/usr/bin/env bash
# vercel-setup.sh — Set all ZA Support Dashboard env vars on Vercel in one shot.
# Usage:
#   export VERCEL_TOKEN=<your_vercel_token>
#   export VERCEL_PROJECT_ID=<project_id_from_vercel_dashboard>
#   export VERCEL_TEAM_ID=<team_id_or_leave_blank>
#   bash vercel-setup.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"
VERCEL_TEAM_ID="${VERCEL_TEAM_ID:-}"   # optional — leave empty for personal account

if [[ -z "$VERCEL_TOKEN" ]]; then
  echo "ERROR: Set VERCEL_TOKEN before running this script."
  exit 1
fi
if [[ -z "$VERCEL_PROJECT_ID" ]]; then
  echo "ERROR: Set VERCEL_PROJECT_ID before running this script."
  echo "       Find it in Vercel Dashboard → Project → Settings → General"
  exit 1
fi

# ── Prompt for values ─────────────────────────────────────────────────────────
echo ""
echo "ZA Support Dashboard — Vercel Environment Setup"
echo "================================================"
echo "Press Enter to keep suggested value. Ctrl-C to abort."
echo ""

read -rp "ZA_API_URL         [https://api.zasupport.com]: " ZA_API_URL
ZA_API_URL="${ZA_API_URL:-https://api.zasupport.com}"

read -rsp "ZA_API_TOKEN       (agent bearer token): " ZA_API_TOKEN
echo ""
if [[ -z "$ZA_API_TOKEN" ]]; then
  echo "ERROR: ZA_API_TOKEN is required."
  exit 1
fi

read -rsp "DASHBOARD_PASSWORD (simple login password, leave blank to skip): " DASHBOARD_PASSWORD
echo ""

read -rsp "NEXTAUTH_SECRET    (random 32-char string, leave blank to auto-generate): " NEXTAUTH_SECRET
echo ""
if [[ -z "$NEXTAUTH_SECRET" ]]; then
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "  Generated NEXTAUTH_SECRET."
fi

NEXTAUTH_URL="https://app.zasupport.com"
read -rp "NEXTAUTH_URL       [$NEXTAUTH_URL]: " _nextauth_url
NEXTAUTH_URL="${_nextauth_url:-$NEXTAUTH_URL}"

# ── Build env var array ───────────────────────────────────────────────────────
build_env_array() {
  local json='['
  local first=true

  add_var() {
    local key="$1" val="$2" targets="$3"
    [[ -z "$val" ]] && return
    $first || json+=','
    first=false
    json+="{\"key\":\"$key\",\"value\":$(printf '%s' "$val" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),\"target\":$targets,\"type\":\"encrypted\"}"
  }

  add_var "ZA_API_URL"          "$ZA_API_URL"          '["production","preview","development"]'
  add_var "ZA_API_TOKEN"        "$ZA_API_TOKEN"        '["production","preview","development"]'
  add_var "NEXTAUTH_SECRET"     "$NEXTAUTH_SECRET"     '["production","preview","development"]'
  add_var "NEXTAUTH_URL"        "$NEXTAUTH_URL"        '["production"]'
  add_var "DASHBOARD_PASSWORD"  "$DASHBOARD_PASSWORD"  '["production","preview","development"]'

  json+=']'
  echo "$json"
}

ENV_JSON=$(build_env_array)

# ── Team query param ──────────────────────────────────────────────────────────
TEAM_PARAM=""
[[ -n "$VERCEL_TEAM_ID" ]] && TEAM_PARAM="?teamId=${VERCEL_TEAM_ID}"

# ── Push to Vercel ────────────────────────────────────────────────────────────
echo ""
echo "Pushing environment variables to Vercel project: $VERCEL_PROJECT_ID ..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env${TEAM_PARAM}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$ENV_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [[ "$HTTP_CODE" == "2"* ]]; then
  echo "SUCCESS — environment variables set on Vercel."
  echo ""
  echo "Next steps:"
  echo "  1. Redeploy the project (or push a commit) to apply the vars."
  echo "  2. Verify: vercel env ls --token=\$VERCEL_TOKEN"
else
  echo "ERROR (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 1
fi
