#!/bin/bash

# Market Underworld GitHub Initialization Script
# Targeted Repository: https://github.com/baalvionservice/market

REPO_URL="https://github.com/baalvionservice/market"

echo "🚀 [MARKET UNDERWORLD] Initializing Global Intelligence Node..."

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init
    echo "✓ Git repository initialized."
else
    echo "✓ Git repository already exists."
fi

# Add all files
git add .
echo "✓ All operational files staged."

# Initial commit
git commit -m "Initialize Underworld Protocol: Global Intelligence Node v2.4.0 [FINAL]"
echo "✓ Commit finalized."

# Rename branch to main
git branch -M main

# Add remote (remove if exists)
git remote remove origin 2>/dev/null
git remote add origin $REPO_URL
echo "✓ Remote origin linked: $REPO_URL"

# Push to GitHub
echo "📡 Broadcasting code to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ DEPLOYMENT SUCCESSFUL."
    echo "🌐 Your node is now live at: $REPO_URL"
else
    echo "❌ DEPLOYMENT FAILED."
    echo "⚠️  Please ensure you have created the repository on GitHub and have the correct permissions."
fi
