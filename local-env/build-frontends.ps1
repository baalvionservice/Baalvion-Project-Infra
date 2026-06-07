# build-frontends.ps1 — production-build all three frontends.
# REQUIRED after any NEXT_PUBLIC_* env change (those values are inlined at build time).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$apps = @(
  @{ name = 'Imperialpedia'; dir = "$root\Frontend\Imperialpedia-main" },
  @{ name = 'Admin Platform'; dir = "$root\Frontend\admin-platform" },
  @{ name = 'IR Baalvion';   dir = "$root\Frontend\IR-Baalvion-main" }
)

foreach ($app in $apps) {
  Write-Host "`n=== Building $($app.name) ===" -ForegroundColor Cyan
  Push-Location $app.dir
  try {
    if (Test-Path "$($app.dir)\.next") { Remove-Item "$($app.dir)\.next" -Recurse -Force }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed for $($app.name)" }
    Write-Host "OK: $($app.name) built." -ForegroundColor Green
  } finally {
    Pop-Location
  }
}
Write-Host "`nAll three frontends built." -ForegroundColor Green
