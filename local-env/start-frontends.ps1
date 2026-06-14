# start-frontends.ps1 — start the three production builds, each on its fixed port,
# in its own window. Run build-frontends.ps1 first if env changed.
#
#   Imperialpedia → :3029   Admin → :3030   IR → :3027
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$apps = @(
  @{ name = 'imperialpedia'; dir = "$root\Frontend\Imperialpedia-main"; port = 3029 },
  @{ name = 'admin';         dir = "$root\Frontend\admin-platform";     port = 3030 },
  @{ name = 'ir';            dir = "$root\Frontend\IR-Baalvion-main";   port = 3027 }
)

foreach ($app in $apps) {
  # Free the port if something already holds it.
  $conns = Get-NetTCPConnection -State Listen -LocalPort $app.port -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    Write-Host "Stopping existing PID $($c.OwningProcess) on :$($app.port)" -ForegroundColor Yellow
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
  }
  Write-Host "Starting $($app.name) on :$($app.port)" -ForegroundColor Cyan
  Start-Process pwsh -ArgumentList @(
    '-NoExit', '-Command',
    "Set-Location '$($app.dir)'; `$host.UI.RawUI.WindowTitle='baalvion-$($app.name)'; npx next start -p $($app.port)"
  )
}
Write-Host "`nThree frontends launching. Give them ~10s, then start the proxy." -ForegroundColor Green
