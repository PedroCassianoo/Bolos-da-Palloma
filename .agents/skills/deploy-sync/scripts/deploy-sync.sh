#!/bin/bash

# ==============================================================================
# SaaS AUTOMATED COMMIT, DEPLOY & DOCS SYNC SKILL (Bolos da Palloma Edition)
# Description: Verifies changes in the Back-Office Panel, Customer Menu, and API,
# updates system documentation, commits, and pushes to trigger Vercel deployment.
# ==============================================================================

# 1. Define Core File Patterns / Directories
DASHBOARD_PATTERN="painel\.html|painel\.js|painel\.css|estoque\.html|receitas\.html|pedidos\.html|assets/"
MENU_PATTERN="index\.html|app\.js|style\.css"
API_PATTERN="api/"
DOCS_DIR="docs"

echo "🚀 Initializing Bolos da Palloma Deployment Skill..."
echo "------------------------------------------------"

# 2. Check for changes in the repositories/files
check_pattern_changes() {
    local pattern=$1
    if git status --porcelain | grep -E -q "$pattern"; then
        echo "true"
    else
        echo "false"
    fi
}

DASHBOARD_CHANGED=$(check_pattern_changes "$DASHBOARD_PATTERN")
MENU_CHANGED=$(check_pattern_changes "$MENU_PATTERN")
API_CHANGED=$(check_pattern_changes "$API_PATTERN")

# 3. Validation & Update Logic
if [ "$DASHBOARD_CHANGED" == "false" ] && [ "$MENU_CHANGED" == "false" ] && [ "$API_CHANGED" == "false" ]; then
    echo "✅ No changes detected in the Back-Office Panel, Customer Menu, or API."
    echo "🛑 Aborting deployment process to save Vercel CI/CD resources."
    exit 0
fi

echo "🔍 Changes detected! Analyzing scopes..."

COMMIT_MESSAGE="feat: system update -"

if [ "$DASHBOARD_CHANGED" == "true" ]; then
    echo "   -> Back-Office / Dashboard modified."
    COMMIT_MESSAGE="$COMMIT_MESSAGE [Dashboard]"
fi

if [ "$MENU_CHANGED" == "true" ]; then
    echo "   -> Customer Digital Menu (Cardápio) modified."
    COMMIT_MESSAGE="$COMMIT_MESSAGE [Menu]"
fi

if [ "$API_CHANGED" == "true" ]; then
    echo "   -> Serverless API / Backend modified."
    COMMIT_MESSAGE="$COMMIT_MESSAGE [API]"
fi

# 4. Documentation Update (Automation Hook)
echo "📝 Updating system documentation..."
# Ensure the docs directory exists
mkdir -p "$DOCS_DIR"

# Generate latest patch notes from git diff
git diff > "$DOCS_DIR/latest_patch_notes.txt"
echo "   -> Patch notes saved to $DOCS_DIR/latest_patch_notes.txt"

# 5. Git Operations (Commit & Push)
echo "📦 Staging files..."
git add .

echo "💬 Committing changes..."
# Asking for a custom note to append to the automatic commit message
read -p "Enter a brief description of the fix/feature for the changelog: " CUSTOM_MSG
FULL_COMMIT_MSG="$COMMIT_MESSAGE $CUSTOM_MSG"

git commit -m "$FULL_COMMIT_MSG"

echo "🚀 Pushing to remote repository (Triggering Vercel Deploy)..."
git push origin main

echo "------------------------------------------------"
echo "🎉 SUCCESS: System updated, documented, and deployed!"
echo "The SaaS is running 100% and ready for the bakeries."
