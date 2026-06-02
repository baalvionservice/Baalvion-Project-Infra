#Requires -Version 5.1
<#
  Baalvion — Zero-to-Beta Bootstrap (Limited-Beta commerce vertical) — Windows/PowerShell.
  Parity with bootstrap.sh. Takes a fresh checkout to a working beta with one command.

    .\bootstrap.ps1                 # idempotent: safe to re-run
    .\bootstrap.ps1 -Fresh          # WIPES the Postgres/Redis volumes first
    .\bootstrap.ps1 -SkipInstall    # skip pnpm install

  Prereqs (standard for this pnpm + Docker monorepo): Docker Desktop, Node 20, pnpm (corepack).
  Stages: preflight -> infra -> migrate -> services -> seed/provision -> fixtures -> health.
  Scope = the verified vertical: postgres, redis, rbac/order/cms/payment (+ commerce/inventory best-effort).
  ledger-service is excluded (fail-open posting; non-monorepo Dockerfile — see DEPLOYMENT_GUIDE.md).
#>
[CmdletBinding()]
param([switch]$Fresh, [switch]$SkipInstall)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot; Set-Location $Root

# ── config ────────────────────────────────────────────────────────────────────
$PG='baalvion-postgres'; $DBNAME='baalvion_db'; $DBUSER='baalvion'; $DBPASS='baalvion_dev_pass'
$STORE='a0a00000-0000-4000-8000-000000000001'
$CUSTOMER='c0000000-0000-4000-8000-000000000001'
$BUYER='9000001'; $OPS='9000099'; $VIEWER='9000088'; $ADMIN='9000077'
$CoreServices=@('cms-service','rbac-service','order-service','payment-service')
$ExtraServices=@('commerce-service','inventory-service')

function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "  OK $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  WARN $m" -ForegroundColor Yellow }
function Die($m){ Write-Host "  FAIL $m" -ForegroundColor Red; exit 1 }
function PsqlDb([string]$sql){ docker exec -e "PGPASSWORD=$DBPASS" $PG psql -U $DBUSER -d $DBNAME -v ON_ERROR_STOP=1 -tAc $sql 2>&1 }

# host-side env so pnpm migrations/seeds reach the published Postgres port
$env:DB_HOST='localhost'; $env:DB_PORT='5432'; $env:DB_NAME=$DBNAME; $env:DB_USER=$DBUSER; $env:DB_PASSWORD=$DBPASS

# =============================================================================
Step 'STAGE 0 — Preflight'
# =============================================================================
try { $dv = docker version --format '{{.Server.Version}}' 2>$null } catch { $dv=$null }
if (-not $dv) { Die 'Docker daemon not running. Start Docker Desktop.' }
Ok "docker $dv"

if (-not (docker network inspect baalvion-net 2>$null)) { docker network create baalvion-net | Out-Null; Ok 'created network baalvion-net' }
else { Ok 'network baalvion-net' }

New-Item -ItemType Directory -Force -Path docker/secrets | Out-Null
if (-not (Test-Path docker/secrets/jwt_private_key.pem)) {
  $ossl = Get-Command openssl -ErrorAction SilentlyContinue
  if ($ossl) {
    & openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out docker/secrets/jwt_private_key.pem 2>$null
    & openssl rsa -in docker/secrets/jwt_private_key.pem -pubout -out docker/secrets/jwt_public_key.pem 2>$null
    Ok 'generated RS256 keypair (docker/secrets/)'
  } else { Die 'No JWT keypair and openssl missing. Run: pnpm run generate:keys' }
} else { Ok 'RS256 keypair present' }

if (-not (Test-Path .env)) {
  if (Test-Path .env.example) { Copy-Item .env.example .env; Ok 'created .env from .env.example' } else { Die 'no .env and no .env.example' }
  $priv1 = ((Get-Content docker/secrets/jwt_private_key.pem) -join '\n')
  $pub1  = ((Get-Content docker/secrets/jwt_public_key.pem) -join '\n')
  Add-Content .env "`nJWT_PRIVATE_KEY=$priv1"
  Add-Content .env "JWT_PUBLIC_KEY=$pub1"
  Add-Content .env 'INTERNAL_SERVICE_SECRET=baalvion-internal-dev-secret'
  Add-Content .env 'INTERNAL_API_KEY=baalvion-rbac-internal-dev-key'
  Add-Content .env 'LEDGER_INTERNAL_KEY=baalvion-ledger-dev-key'
  Add-Content .env 'CART_SESSION_SECRET=baalvion-cart-dev-secret'
  Ok 'injected keypair + dev secrets into .env'
} else { Ok '.env present (left as-is)' }
# load .env into this session (payment harness needs INTERNAL_SERVICE_SECRET)
Get-Content .env | Where-Object { $_ -match '^[A-Z_][A-Z0-9_]*=' } | ForEach-Object {
  $k,$v = $_ -split '=',2; if ($k -and $k -notmatch 'KEY$') { Set-Item -Path "env:$k" -Value $v -ErrorAction SilentlyContinue }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Die 'Node.js 20 not found.' }
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { corepack enable 2>$null | Out-Null }
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { Die "pnpm not found. Run 'corepack enable' (Node 20)." }
Ok "node $(node -v) · pnpm $(pnpm -v)"

if (-not $SkipInstall -and -not (Test-Path node_modules)) {
  Step 'STAGE 0b — pnpm install (provides sequelize-cli + service deps)'
  pnpm install --frozen-lockfile; if ($LASTEXITCODE -ne 0) { pnpm install }
  if ($LASTEXITCODE -ne 0) { Die 'pnpm install failed' } else { Ok 'workspace installed' }
}

# =============================================================================
Step 'STAGE 1 — Infrastructure (Postgres + Redis)'
# =============================================================================
if ($Fresh) { Warn '-Fresh: removing Postgres/Redis volumes (DESTROYS all data)'; docker compose down -v 2>$null | Out-Null }
docker compose up -d postgres redis 2>$null | Out-Null
Write-Host '  waiting for postgres' -NoNewline
for ($i=0; $i -lt 30; $i++) {
  $h = docker inspect --format='{{.State.Health.Status}}' $PG 2>$null
  if ($h -eq 'healthy') { break }; Write-Host '.' -NoNewline; Start-Sleep 2
}
Write-Host ''
if ((docker inspect --format='{{.State.Health.Status}}' $PG 2>$null) -eq 'healthy') { Ok 'postgres healthy on :5432' } else { Warn 'postgres health not confirmed' }

# =============================================================================
Step 'STAGE 2 — Migrations (beta-vertical schemas)'
# =============================================================================
pnpm --filter rbac-service exec node scripts/seed.js
if ($LASTEXITCODE -eq 0) { Ok 'rbac schema + default hierarchy (platform tenant, system roles)' } else { Warn 'rbac seed reported an issue (idempotent)' }
foreach ($svc in @('commerce-service','order-service','inventory-service','cms-service')) {
  pnpm --filter $svc exec sequelize-cli db:migrate 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { Ok "migrated $svc" } else { Warn "sequelize-cli db:migrate incomplete for $svc (already-applied is OK)" }
}

# =============================================================================
Step 'STAGE 3 — Services (beta vertical)'
# =============================================================================
docker compose up -d --build @CoreServices 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { Ok "started: $($CoreServices -join ', ')" } else { Die 'failed to start core beta services' }
docker compose up -d --build @ExtraServices 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { Ok "started: $($ExtraServices -join ', ')" } else { Warn 'commerce/inventory not started (storefront-only)' }
Start-Sleep 6

# =============================================================================
Step 'STAGE 4 — Seed & provision (idempotent)'
# =============================================================================
pnpm --filter commerce-service exec node scripts/seedAmarise.js
if ($LASTEXITCODE -eq 0) { Ok 'seeded commerce catalog (Amarisé store + products)' } else { Warn 'seedAmarise reported an issue' }

$provToken = (node Backend/scripts/mint-token.cjs --sub $ADMIN --roles super_admin 2>$null)
if ($provToken) {
  $env:RBAC_PROVISION_TOKEN=$provToken; $env:RBAC_BASE_URL='http://localhost:3055'
  pnpm --filter commerce-service exec node scripts/provisionCommerceRbac.cjs
  if ($LASTEXITCODE -eq 0) { Ok 'provisioned commerce RBAC (roles, grants, store→tenant sync)' } else { Warn 'provisionCommerceRbac reported an issue (idempotent)' }
  Remove-Item env:RBAC_PROVISION_TOKEN -ErrorAction SilentlyContinue
} else { Warn 'could not mint super-admin token — skipped RBAC provisioning' }

pnpm --filter cms-service exec node scripts/seedBaalvionMining.cjs 2>$null | Out-Null
pnpm --filter cms-service exec node scripts/configurePaymentSites.cjs
if ($LASTEXITCODE -eq 0) { Ok 'configured payment providers in CMS vault (mock mode)' } else { Warn 'configurePaymentSites reported an issue' }

# =============================================================================
Step 'STAGE 5 — Fixtures (test customer, role assignments, admin)'
# =============================================================================
PsqlDb "INSERT INTO orders.orders_customers (id, store_id, user_id, email, first_name, last_name, is_active, created_at, updated_at) VALUES ('$CUSTOMER','$STORE',$BUYER,'warroom.buyer@baalvion.test','Warroom','Buyer',true,now(),now()) ON CONFLICT (id) DO NOTHING;" | Out-Null
Ok "test customer $CUSTOMER (user $BUYER)"

function Assign-Org($uid,$roleKey){ PsqlDb "INSERT INTO rbac.role_assignments (user_id, role_id, tenant_id, scope_type, scope_id, status, created_at, updated_at) SELECT '$uid', r.id, t.id, 'organization', '$STORE', 'active', now(), now() FROM rbac.roles r, rbac.tenants t WHERE r.key='$roleKey' AND t.type='platform' AND NOT EXISTS (SELECT 1 FROM rbac.role_assignments a WHERE a.user_id='$uid' AND a.role_id=r.id AND a.scope_id='$STORE');" | Out-Null }
Assign-Org $OPS 'ops_manager';   Ok "assigned ops_manager → user $OPS @ store"
Assign-Org $VIEWER 'store_viewer'; Ok "assigned store_viewer → user $VIEWER @ store"
PsqlDb "INSERT INTO rbac.role_assignments (user_id, role_id, tenant_id, scope_type, scope_id, status, created_at, updated_at) SELECT '$ADMIN', r.id, t.id, 'platform', NULL, 'active', now(), now() FROM rbac.roles r, rbac.tenants t WHERE r.key='super_admin' AND t.type='platform' AND NOT EXISTS (SELECT 1 FROM rbac.role_assignments a WHERE a.user_id='$ADMIN' AND a.role_id=r.id);" | Out-Null
Ok "admin (super_admin) → user $ADMIN @ platform"

$product = (PsqlDb "SELECT id FROM commerce.commerce_products WHERE store_id='$STORE' AND status='published' ORDER BY created_at LIMIT 1;").Trim()
if (-not $product) { $product='ec572c4a-4745-4679-8edd-493ee557a2c5' }
$fixtures = [ordered]@{
  store=$STORE; product=$product; customer=$CUSTOMER; customerUserId=$BUYER; shopperUserId='9000002'
  opsUserId=$OPS; viewerUserId=$VIEWER; adminUserId=$ADMIN; paymentSite='baalvion-mining'
  paymentWebhookSecret='rzp_whsec_mining_e2e'; crossTenantSite='baalvionstack-shop'
  generatedAt=(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
}
$fixtures | ConvertTo-Json | Set-Content -Path warroom/beta-fixtures.json -Encoding utf8
Ok "wrote warroom/beta-fixtures.json (product=$product)"

# =============================================================================
Step 'STAGE 6 — Health verification'
# =============================================================================
# cms exposes /api/v1/health; the rest use /health
$targets = [ordered]@{
  'rbac-service'    = 'http://localhost:3055/health'
  'order-service'   = 'http://localhost:3013/health'
  'payment-service' = 'http://localhost:3019/health'
  'cms-service'     = 'http://localhost:3011/api/v1/health'
}
$failed = 0
foreach ($svc in $targets.Keys) {
  $url = $targets[$svc]
  try { $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5; $code=$r.StatusCode } catch { $code = ($_.Exception.Response.StatusCode.value__) }
  if ($code -eq 200) { Ok "$svc -> 200 ($url)" } else { Warn "$svc -> $code ($url)"; $failed++ }
}

Write-Host ''
Write-Host '=====================================================' -ForegroundColor Magenta
Write-Host '   BAALVION BETA BOOTSTRAP — COMPLETE' -ForegroundColor Magenta
Write-Host '=====================================================' -ForegroundColor Magenta
Write-Host "  Store       : $STORE (Amarisé Maison Avenue)"
Write-Host "  Product     : $product"
Write-Host "  Buyer       : user $BUYER (customer $CUSTOMER)"
Write-Host "  Ops/Viewer  : user $OPS / user $VIEWER"
Write-Host "  Admin token : node Backend/scripts/mint-token.cjs --sub $ADMIN --roles super_admin"
Write-Host ''
Write-Host '  Verify:  node warroom/revenue_e2e.cjs --refund'
Write-Host '           node warroom/enforcement_e2e.cjs'
Write-Host '           node warroom/payment_e2e.cjs'
Write-Host '           node warroom/security_e2e.cjs'
Write-Host ''
if ($failed -gt 0) { Warn "$failed service(s) not healthy"; exit 1 }
Ok 'all beta services healthy — environment is READY'
