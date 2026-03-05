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
if command -v vercel &>/dev/null; then
    echo "  Deploying to Vercel..."
    vercel --prod --yes
    echo "  ✓ Deployed to Vercel"
else
    echo ""
    echo "  ── Manual Vercel Deploy ──────────────────────────────────────────"
    echo "  Vercel CLI not found. To deploy manually:"
    echo ""
    echo "  1. Install CLI:  npm install -g vercel"
    echo "  2. Login:        vercel login"
    echo "  3. Deploy:       vercel --prod"
    echo ""
    echo "  OR import via dashboard:"
    echo "  → https://vercel.com/new"
    echo "  → Import: zasupport/za-support-dashboard"
    echo "  → Add env vars: ZA_API_URL, ZA_API_TOKEN, DASHBOARD_PASSWORD"
    echo "  ──────────────────────────────────────────────────────────────────"
fi

echo ""
echo "  ✓ Deploy complete"
echo ""
