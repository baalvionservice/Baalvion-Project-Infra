# ============================================================
#  Baalvion Platform -- Startup (DEPRECATED, redirects)
#
#  This script previously launched the WHOLE fleet with `npm run dev` against the
#  old flat Backend\<service> layout. That is a customer-facing hazard (dev/HMR
#  servers, development runtime) and the paths no longer exist after the monorepo
#  migration. It has been retired so it can no longer start a dev fleet.
#
#  Use instead:
#    .\start-prod.ps1     Production host fleet via PM2 (next start / vite preview,
#                         NODE_ENV=production, DB health-gated, no startup storm).
#                         Add -Build to build frontends first.
#    .\bootstrap.ps1      Compose-only Limited-Beta commerce vertical (see DEPLOYMENT_GUIDE.md).
# ============================================================
param(
    [switch]$All,
    [switch]$Frontend,
    [switch]$SkipInstall
)

Write-Host "`n  start.ps1 is deprecated — it launched a DEVELOPMENT fleet." -ForegroundColor Yellow
Write-Host "  For the production host fleet, use:" -ForegroundColor Yellow
Write-Host "      .\start-prod.ps1            # production PM2 fleet" -ForegroundColor Cyan
Write-Host "      .\start-prod.ps1 -Build     # build frontends first, then start" -ForegroundColor Cyan
Write-Host "  For the compose-only beta vertical, use:" -ForegroundColor Yellow
Write-Host "      .\bootstrap.ps1`n" -ForegroundColor Cyan

$ans = Read-Host 'Run .\start-prod.ps1 now? (y/N)'
if ($ans -eq 'y' -or $ans -eq 'Y') {
    & "$PSScriptRoot\start-prod.ps1"
} else {
    Write-Host '  Aborted. No dev fleet was started.' -ForegroundColor DarkGray
}
