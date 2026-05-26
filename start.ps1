# ============================================================
#  Baalvion Platform -- Master Startup Script
#  Run from:  d:\Baalvion Projects\
#  Usage:     .\start.ps1            (backends only)
#             .\start.ps1 -All       (backends + frontends)
#             .\start.ps1 -Frontend  (frontends only)
# ============================================================
param(
    [switch]$All,
    [switch]$Frontend,
    [switch]$SkipInstall
)

$Root = $PSScriptRoot
Set-Location $Root

# -- Colors -----------------------------------------------------------
function Write-Step  { param($msg) Write-Host "`n  >> $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  OK $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  FAIL $msg" -ForegroundColor Red }

Write-Host "`n=====================================================" -ForegroundColor Magenta
Write-Host "       BAALVION PLATFORM -- STARTUP SCRIPT          " -ForegroundColor Magenta
Write-Host "=====================================================`n" -ForegroundColor Magenta

# -- 1. Check Docker --------------------------------------------------
Write-Step "Checking Docker..."
try {
    $dockerVer = docker --version 2>&1
    Write-Ok "Docker: $dockerVer"
} catch {
    Write-Fail "Docker not found. Please install Docker Desktop."
    exit 1
}

# -- 2. Start databases -----------------------------------------------
Write-Step "Starting databases (PostgreSQL + Redis + pgAdmin)..."
docker compose up -d postgres redis pgadmin 2>&1 | Out-Null

# Wait for PostgreSQL to be healthy
Write-Host "  Waiting for PostgreSQL to be ready..." -NoNewline
$retries = 0
do {
    Start-Sleep -Seconds 2
    $health = docker inspect --format='{{.State.Health.Status}}' baalvion-postgres 2>&1
    Write-Host "." -NoNewline
    $retries++
} while ($health -ne "healthy" -and $retries -lt 20)

if ($health -eq "healthy") {
    Write-Host ""
    Write-Ok "PostgreSQL is healthy on :5432"
    Write-Ok "Redis is running on :6379"
    Write-Ok "pgAdmin available at http://localhost:5050  (admin@baalvion.com / baalvion_admin)"
} else {
    Write-Host ""
    Write-Warn "PostgreSQL health check timed out -- continuing anyway"
}

# -- 3. Install backend dependencies ----------------------------------
if (-not $SkipInstall) {
    Write-Step "Installing backend dependencies..."
    $backends = @(
        "Backend\auth-service",
        "Backend\backend-Proxy-BaalvionStack",
        "Backend\jobs-service",
        "Backend\mining-service",
        "Backend\imperialpedia-service",
        "Backend\real-estate-service",
        "Backend\brand-connector-service",
        "Backend\market-service",
        "Backend\ir-service",
        "Backend\dashboard-service",
        "Backend\about-service",
        "Backend\cms-service",
        "Backend\commerce-service",
        "Backend\order-service",
        "Backend\inventory-service",
        "Backend\fulfillment-service"
    )
    foreach ($svc in $backends) {
        $path = Join-Path $Root $svc
        if (Test-Path $path) {
            if (-not (Test-Path "$path\node_modules")) {
                Write-Host "  Installing $svc..." -NoNewline
                Push-Location $path
                npm install --prefer-offline --silent 2>&1 | Out-Null
                Pop-Location
                Write-Host " done" -ForegroundColor Green
            } else {
                Write-Ok "$svc (already installed)"
            }
        } else {
            Write-Warn "$svc directory not found, skipping"
        }
    }
}

# -- 4. Start backends ------------------------------------------------
if (-not $Frontend) {
    Write-Step "Starting all backend services..."

    $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
    if ($pm2) {
        Write-Ok "Using pm2 for process management"
        pm2 stop baalvion-platform 2>&1 | Out-Null
        pm2 delete baalvion-platform 2>&1 | Out-Null
        pm2 start pm2.config.js --env development
        Write-Ok "All backend services started via pm2"
        Write-Host "`n  Run 'pm2 logs' to view logs" -ForegroundColor Gray
        Write-Host "  Run 'pm2 status' to see service status" -ForegroundColor Gray
        Write-Host "  Run 'pm2 stop all' to stop all services" -ForegroundColor Gray
    } else {
        Write-Warn "pm2 not found -- opening each service in a new terminal window"

        $services = @(
            @{ name="AUTH     :3001"; dir="Backend\auth-service" },
            @{ name="PROXY    :4000"; dir="Backend\backend-Proxy-BaalvionStack" },
            @{ name="JOBS     :3002"; dir="Backend\jobs-service" },
            @{ name="MINING   :3003"; dir="Backend\mining-service" },
            @{ name="IMPERIAL :3004"; dir="Backend\imperialpedia-service" },
            @{ name="REALESTATE:3005"; dir="Backend\real-estate-service" },
            @{ name="BRAND    :3006"; dir="Backend\brand-connector-service" },
            @{ name="MARKET   :3007"; dir="Backend\market-service" },
            @{ name="IR       :3008"; dir="Backend\ir-service" },
            @{ name="DASHBOARD:3009"; dir="Backend\dashboard-service" },
            @{ name="ABOUT    :3010"; dir="Backend\about-service" },
            @{ name="CMS      :3011"; dir="Backend\cms-service" },
            @{ name="COMMERCE :3012"; dir="Backend\commerce-service" },
            @{ name="ORDERS   :3013"; dir="Backend\order-service" },
            @{ name="INVENTORY:3014"; dir="Backend\inventory-service" },
            @{ name="FULFILL  :3015"; dir="Backend\fulfillment-service" }
        )

        foreach ($svc in $services) {
            $svcPath = Join-Path $Root $svc.dir
            $label = $svc.name
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$svcPath'; npm run dev"
            Start-Sleep -Milliseconds 300
        }
        Write-Ok "Opened $($services.Count) terminal windows for backend services"
    }
}

# -- 5. Start frontends (optional) ------------------------------------
if ($All -or $Frontend) {
    Write-Step "Starting frontend projects..."

    if (-not $SkipInstall) {
        $frontends = @(
            "Frontend\about-baalvion-main",
            "Frontend\AmariseMaisonAvenue-main",
            "Frontend\Baalvion-Jobs-Portal-main",
            "Frontend\brand-connector-main",
            "Frontend\company-unified-Dashboard-main",
            "Frontend\controlthemarket-main",
            "Frontend\Imperialpedia-main",
            "Frontend\IR-Baalvion-main",
            "Frontend\Mining.Baalvion-main",
            "Frontend\Proxy-BaalvionStack",
            "Frontend\admin-platform"
        )
        foreach ($fe in $frontends) {
            $path = Join-Path $Root $fe
            if (Test-Path $path) {
                if (-not (Test-Path "$path\node_modules")) {
                    Write-Host "  Installing $fe..." -NoNewline
                    Push-Location $path
                    npm install --prefer-offline --silent 2>&1 | Out-Null
                    Pop-Location
                    Write-Host " done" -ForegroundColor Green
                }
            }
        }
    }

    $feServices = @(
        @{ name="ABOUT      :3020"; dir="Frontend\about-baalvion-main";           port=3020 },
        @{ name="AMARISE    :3021"; dir="Frontend\AmariseMaisonAvenue-main";       port=3021 },
        @{ name="JOBS-UI    :3022"; dir="Frontend\Baalvion-Jobs-Portal-main";      port=3022 },
        @{ name="BRAND-UI   :3023"; dir="Frontend\brand-connector-main";           port=3023 },
        @{ name="DASHBOARD  :3024"; dir="Frontend\company-unified-Dashboard-main"; port=3024 },
        @{ name="MARKET-UI  :3025"; dir="Frontend\controlthemarket-main";          port=3025 },
        @{ name="IMPERIAL-UI:3026"; dir="Frontend\Imperialpedia-main";             port=3026 },
        @{ name="IR-UI      :3027"; dir="Frontend\IR-Baalvion-main";               port=3027 },
        @{ name="MINING-UI  :3028"; dir="Frontend\Mining.Baalvion-main";           port=3028 },
        @{ name="PROXY-UI   :5173"; dir="Frontend\Proxy-BaalvionStack";            port=5173 },
        @{ name="ADMIN-UI   :3030"; dir="Frontend\admin-platform";                port=3030 }
    )

    foreach ($fe in $feServices) {
        $fePath = Join-Path $Root $fe.dir
        if (Test-Path $fePath) {
            $label  = $fe.name
            $port   = $fe.port
            $devCmd = if ($fe.dir -like "*Proxy*") { "npm run dev" } else { "npm run dev -- --port $port" }
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$fePath'; `$host.UI.RawUI.WindowTitle = '$label'; $devCmd"
            Start-Sleep -Milliseconds 400
        }
    }
    Write-Ok "Opened $($feServices.Count) terminal windows for frontend projects"
}

# -- 6. Summary -------------------------------------------------------
Write-Host "`n=====================================================" -ForegroundColor Magenta
Write-Host "               ALL SERVICES RUNNING                " -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  DATABASES" -ForegroundColor White
Write-Host "  --------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  PostgreSQL   localhost:5432   db=baalvion_db" -ForegroundColor White
Write-Host "  Redis        localhost:6379" -ForegroundColor White
Write-Host "  pgAdmin      http://localhost:5050" -ForegroundColor White
Write-Host ""
Write-Host "  BACKENDS" -ForegroundColor White
Write-Host "  --------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Auth Service          http://localhost:3001" -ForegroundColor White
Write-Host "  Proxy Backend         http://localhost:4000" -ForegroundColor White
Write-Host "  Jobs Service          http://localhost:3002" -ForegroundColor White
Write-Host "  Mining Service        http://localhost:3003" -ForegroundColor White
Write-Host "  Imperialpedia         http://localhost:3004" -ForegroundColor White
Write-Host "  Real Estate           http://localhost:3005" -ForegroundColor White
Write-Host "  Brand Connector       http://localhost:3006" -ForegroundColor White
Write-Host "  Market Service        http://localhost:3007" -ForegroundColor White
Write-Host "  IR Service            http://localhost:3008" -ForegroundColor White
Write-Host "  Dashboard Service     http://localhost:3009" -ForegroundColor White
Write-Host "  About Service         http://localhost:3010" -ForegroundColor White
Write-Host "  CMS Service           http://localhost:3011" -ForegroundColor White
Write-Host "  Commerce Service      http://localhost:3012" -ForegroundColor White
Write-Host "  Order Service         http://localhost:3013" -ForegroundColor White
Write-Host "  Inventory Service     http://localhost:3014" -ForegroundColor White
Write-Host "  Fulfillment Service   http://localhost:3015" -ForegroundColor White

if ($All -or $Frontend) {
    Write-Host ""
    Write-Host "  FRONTENDS" -ForegroundColor White
    Write-Host "  --------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  About Baalvion        http://localhost:3020" -ForegroundColor White
    Write-Host "  AmariseMaison         http://localhost:3021" -ForegroundColor White
    Write-Host "  Jobs Portal           http://localhost:3022" -ForegroundColor White
    Write-Host "  Brand Connector       http://localhost:3023" -ForegroundColor White
    Write-Host "  Company Dashboard     http://localhost:3024" -ForegroundColor White
    Write-Host "  Control The Market    http://localhost:3025" -ForegroundColor White
    Write-Host "  Imperialpedia         http://localhost:3026" -ForegroundColor White
    Write-Host "  IR Baalvion           http://localhost:3027" -ForegroundColor White
    Write-Host "  Mining / GeoTrade     http://localhost:3028" -ForegroundColor White
    Write-Host "  Proxy Dashboard       http://localhost:5173" -ForegroundColor White
    Write-Host "  Admin Platform        http://localhost:3030" -ForegroundColor White
}
Write-Host ""
