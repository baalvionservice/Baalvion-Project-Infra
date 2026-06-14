Write-Host "====================================="
Write-Host " BAALVION FULL PROJECT DIAGNOSTIC "
Write-Host "====================================="

Write-Host ""
Write-Host "1. Checking Node version..."
node -v

Write-Host ""
Write-Host "2. Checking pnpm version..."
pnpm -v

Write-Host ""
Write-Host "3. Checking Next.js install..."
pnpm list next

Write-Host ""
Write-Host "4. Cleaning cache..."
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "5. Checking TypeScript..."
npx tsc --noEmit

Write-Host ""
Write-Host "6. Running ESLint..."
npx eslint . --ext .ts,.tsx,.js,.jsx

Write-Host ""
Write-Host "7. Checking dependency issues..."
pnpm audit

Write-Host ""
Write-Host "8. Checking duplicate dependencies..."
pnpm dedupe --check

Write-Host ""
Write-Host "9. Running Next.js build..."
pnpm build

Write-Host ""
Write-Host "10. Listing large folders..."
Get-ChildItem -Directory | Sort-Object Name

Write-Host ""
Write-Host "====================================="
Write-Host " DIAGNOSTIC COMPLETE "
Write-Host "====================================="