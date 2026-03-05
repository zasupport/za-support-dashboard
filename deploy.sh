#!/bin/bash
# ZA Support Dashboard — Deploy Script
# Usage: bash deploy.sh
# Deploys to Vercel production

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "  ZA Support Dashboard — Deploy"
echo ""

# Build check
echo "  Building..."
npm run build
echo "  ✓ Build passed"

# Push to GitHub
echo "  Pushing to GitHub..."
git add -A
git status --short
git diff --cached --quiet && echo "  Nothing to commit — skipping" || git commit -m "chore: pre-deploy update"
git push origin main
echo "  ✓ Pushed to main"

# Vercel deploy
command -v vercel &>/dev/null || npm install -g vercel

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
    echo "  Deploying to Vercel (token auth)..."
    vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
    vercel build --prod --token="$VERCEL_TOKEN"
    vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
    echo "  ✓ Deployed to Vercel"
else
    echo ""
    echo "  ── One-Time Vercel Setup (do this once) ─────────────────────────"
    echo "  1. Get token:  https://vercel.com/account/tokens  → Create Token"
    echo "  2. Link repo:  VERCEL_TOKEN=<token> vercel link --yes"
    echo "  3. Get IDs:    cat .vercel/project.json"
    echo "  4. Add to GitHub Secrets (zasupport/za-support-dashboard):"
    echo "       VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID"
    echo "       ZA_API_URL, ZA_API_TOKEN, DASHBOARD_PASSWORD"
    echo "  5. After that: every git push auto-deploys via GitHub Actions"
    echo ""
    echo "  Or deploy now: VERCEL_TOKEN=<your-token> bash deploy.sh"
    echo "  ────────────────────────────────────────────────────────────────"
fi

echo ""
echo "  ✓ Deploy complete"
echo ""
