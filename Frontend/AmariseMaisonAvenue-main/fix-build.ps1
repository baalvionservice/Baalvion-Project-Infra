Write-Host "🚀 Starting Baalvion Auto Fix..." -ForegroundColor Cyan

# 1. Kill Next.js processes (avoid lock issues)
Write-Host "🧹 Stopping running Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Remove Next cache
Write-Host "🗑️ Cleaning .next cache..."
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

# 3. Optional: clean node_modules cache issues
Write-Host "🧼 Cleaning pnpm store cache..."
pnpm store prune

# 4. Reinstall dependencies (safe mode)
Write-Host "📦 Installing dependencies..."
pnpm install

# 5. Type check (optional early fail detection)
Write-Host "🔎 Running TypeScript check..."
pnpm exec tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript errors found. Fix them before build." -ForegroundColor Red
    exit 1
}

# 6. Build project
Write-Host "🏗️ Building project..."
pnpm build

# 7. Success message
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
} else {
    Write-Host "❌ BUILD FAILED - check errors above" -ForegroundColor Red
}