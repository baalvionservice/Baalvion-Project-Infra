#Requires -Version 5.1
<#
  Baalvion — Production fleet startup (Windows/PowerShell).

  Locks the host fleet to a production launch posture and starts it reliably:

    1. ensures the gitignored fleet-wide S2S secrets exist (so auth-gateway and the
       trade order-execution-service boot under production instead of fail-fasting),
    2. brings up the datastores and WAITS for Postgres health BEFORE starting any
       service — this is the fix for the cold-DB "startup storm" where DB-backed
       services crash-loop on "the database system is starting up",
    3. optionally builds all frontends (next build / vite build) so `next start`
       and `vite preview` have a valid production build to serve,
    4. starts the PM2 fleet (ecosystem.config.js) in production and persists it.

  Usage:
    .\start-prod.ps1              # start fleet (assumes frontends already built)
    .\start-prod.ps1 -Build       # build all apps first, then start
    .\start-prod.ps1 -SkipInfra   # leave Docker alone (datastores already up)

  Datastores run in Docker (postgres :5432, redis :6379). Docker-owned services
  (cms/rbac/payment/law) are NOT in the PM2 fleet — bring them up via docker compose.
#>
[CmdletBinding()]
param([switch]$Build, [switch]$SkipInfra)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
Set-Location $Root

function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "  OK $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  WARN $m" -ForegroundColor Yellow }
function Die($m){ Write-Host "  FAIL $m" -ForegroundColor Red; exit 1 }

# ── 0 — Preflight ───────────────────────────────────────────────────────────
Step 'Preflight'
if (-not (Get-Command pm2  -ErrorAction SilentlyContinue)) { Die 'pm2 not found. Install: npm i -g pm2' }
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { Die 'pnpm not found. Run: corepack enable' }
Ok 'pm2 + pnpm present'

# ── 1 — Fleet production secrets (gitignored) ───────────────────────────────
# ecosystem.config.js also auto-generates these on first load, but generate here
# too so the file exists pre-start and the operator sees it happen.
Step 'Fleet production secrets'
$secretsFile = Join-Path $Root 'secrets\fleet.prod.env'
if (-not (Test-Path $secretsFile)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $secretsFile) | Out-Null
  function New-Secret { -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }) }
  @(
    '# Auto-generated fleet-wide production S2S secrets — gitignored, never commit.'
    '# Injected into every backend service by ecosystem.config.js.'
    "INTERNAL_SERVICE_SECRET=$(New-Secret)"
    "GATEWAY_SIGNING_SECRET=$(New-Secret)"
    "FINANCE_WEBHOOK_SECRET=$(New-Secret)"
  ) | Set-Content -Path $secretsFile -Encoding ascii
  Ok 'generated secrets\fleet.prod.env'
} else { Ok 'secrets\fleet.prod.env present' }

# auth-service requires RS256 keys on disk under production (vault.js fail-fast).
$priv = Join-Path $Root 'Backend\services\identity\.keys\jwt_private.pem'
if (Test-Path $priv) { Ok 'auth-service RS256 keys present' }
else { Warn "auth-service RSA key missing ($priv) — run: pnpm run generate:keys" }

# ── 2 — Datastores + health gate (prevents the cold-DB startup storm) ───────
if (-not $SkipInfra) {
  Step 'Datastores (Postgres + Redis)'
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Die 'docker not found.' }
  docker compose up -d postgres redis 2>&1 | Out-Null
  Write-Host '  waiting for postgres' -NoNewline
  $healthy = $false
  for ($i = 0; $i -lt 30; $i++) {
    $h = docker inspect --format='{{.State.Health.Status}}' baalvion-postgres 2>$null
    if ($h -eq 'healthy') { $healthy = $true; break }
    Write-Host '.' -NoNewline; Start-Sleep -Seconds 2
  }
  Write-Host ''
  if ($healthy) { Ok 'postgres healthy on :5432  ·  redis on :6379' }
  else { Warn 'postgres health not confirmed — services will retry with PM2 backoff' }
} else { Ok 'skipping infra (-SkipInfra)' }

# ── 3 — Optional production builds ──────────────────────────────────────────
if ($Build) {
  Step 'Building all apps (turbo run build)'
  pnpm build
  if ($LASTEXITCODE -ne 0) { Warn 'build reported errors — only apps with a valid build will serve' }
  else { Ok 'build complete' }
}

# ── 4 — Start the fleet (production) ────────────────────────────────────────
# DB is already healthy, so backends connect immediately (no cold-DB storm).
# startOrReload is idempotent; --update-env re-reads NODE_ENV/secrets on reload.
Step 'Starting PM2 fleet (production)'
pm2 startOrReload ecosystem.config.js --update-env
if ($LASTEXITCODE -ne 0) { Die 'pm2 start failed' }
pm2 save | Out-Null
Ok 'fleet started + saved (pm2 resurrect restores this on reboot)'

Step 'Status'
pm2 status
Write-Host "`nLogs: pm2 logs   ·   Stop: pm2 stop all   ·   Frontend-only: pm2 startOrReload Frontend\ecosystem.frontend.config.cjs" -ForegroundColor DarkGray
