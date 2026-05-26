# ============================================================
#  Baalvion Platform — Stop Script
# ============================================================
Write-Host "`n  Stopping Baalvion Platform..." -ForegroundColor Cyan

# Stop pm2 services if running
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2) {
    pm2 stop all 2>&1 | Out-Null
    pm2 delete all 2>&1 | Out-Null
    Write-Host "  ✓ pm2 services stopped" -ForegroundColor Green
}

# Stop Docker containers
Set-Location $PSScriptRoot
docker compose down 2>&1 | Out-Null
Write-Host "  ✓ Docker containers stopped" -ForegroundColor Green
Write-Host "`n  All services stopped.`n" -ForegroundColor Magenta
