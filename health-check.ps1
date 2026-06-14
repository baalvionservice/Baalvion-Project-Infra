<#
.SYNOPSIS
  Baalvion local stack health check. Probes every backend, frontend, and infra
  port and prints a grouped UP/DOWN status table with clickable localhost links.

.DESCRIPTION
  Uses a fast TCP connect test ("is the port listening?") which is the most
  reliable signal of "is it up" and avoids false negatives from slow Next.js
  cold compiles. Pass -Http to additionally fetch the HTTP status code for
  web/API targets (slower; a few seconds per cold Next dev server).

.EXAMPLE
  pwsh ./health-check.ps1
  pwsh ./health-check.ps1 -Http
#>
[CmdletBinding()]
param(
  [switch]$Http,
  [int]$TimeoutMs = 1200
)

function Test-Port {
  param([string]$TargetHost = '127.0.0.1', [int]$Port, [int]$TimeoutMs = 1200)
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $iar = $client.BeginConnect($TargetHost, $Port, $null, $null)
    if ($iar.AsyncWaitHandle.WaitOne($TimeoutMs)) {
      $client.EndConnect($iar); return $true
    }
    return $false
  } catch { return $false } finally { $client.Close() }
}

function Get-HttpCode {
  param([string]$Url, [int]$TimeoutSec = 8)
  try {
    $r = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSec `
         -SkipHttpErrorCheck -MaximumRedirection 0 -ErrorAction Stop
    return [int]$r.StatusCode
  } catch {
    if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    return 0
  }
}

# name, port, healthPath (for -Http), note
$infra = @(
  @('Postgres',        5432, $null,        'DB'),
  @('Redis',           6379, $null,        'cache/bus'),
  @('API Gateway',       80, '/',          'nginx'),
  @('Keycloak',        8088, '/',          'IdP'),
  @('Grafana',         3100, '/',          'dashboards'),
  @('Prometheus',      9090, '/',          'metrics'),
  @('MinIO console',   9001, '/',          'S3'),
  @('Mailpit',         8025, '/',          'email UI')
)

$backends = @(
  @('auth-service',            3001, '/health'),
  @('session-service',         3022, '/health'),
  @('oauth-service',           3023, '/health'),
  @('rbac-service',            3055, '/health'),
  @('auth-gateway (BFF)',      3099, '/health'),
  @('admin-service',           3021, '/health'),
  @('commerce-service',        3012, '/health'),
  @('order-service',           3013, '/health'),
  @('inventory-service',       3014, '/health'),
  @('law-service',             3015, '/health'),
  @('payment-service',         3019, '/health'),
  @('trade-service',           3025, '/health'),
  @('dashboard-service',       3009, '/health'),
  @('jobs-service',            3002, '/health'),
  @('ctm-service',             3017, '/health'),
  @('ir-service',              3008, '/health'),
  @('imperialpedia-service',   3004, '/health'),
  @('brand-connector-service', 3006, '/health'),
  @('insiders-service',        3050, '/health'),
  @('proxy-service',           4000, '/health'),
  @('cms-service',             3011, '/'),
  @('realtime-service',        3040, '/health'),
  @('about-service',           3010, '/health'),
  @('mining-service',          3003, '/health'),
  @('market-service',          3007, '/health'),
  @('real-estate-service',     3005, '/health')
)

$frontends = @(
  @('admin-platform',           3030, '/'),
  @('about-baalvion',           3020, '/'),
  @('IR-Baalvion',              3027, '/'),
  @('Imperialpedia',            3029, '/'),
  @('Amarise Maison',           3033, '/'),
  @('controlthemarket',         3034, '/'),
  @('company-dashboard',        3024, '/'),
  @('Law-Elite-Network',        9002, '/'),
  @('Jobs Portal',              3026, '/'),
  @('Mining.Baalvion',          3028, '/'),
  @('brand-connector',          3035, '/'),
  @('Global-Trade-Infra',       9003, '/'),
  @('For-Investors',            8080, '/'),
  @('Proxy-BaalvionStack',      8090, '/')
)

$up = 0; $down = 0

function Show-Group {
  param([string]$Title, [object[]]$Items)
  Write-Host ""
  Write-Host "  $Title" -ForegroundColor Cyan
  Write-Host ("  " + ("-" * 64)) -ForegroundColor DarkGray
  foreach ($it in $Items) {
    $name = $it[0]; $port = [int]$it[1]; $path = $it[2]
    $listening = Test-Port -Port $port -TimeoutMs $TimeoutMs
    $statusTxt = ''
    if ($listening -and $Http -and $path) {
      $code = Get-HttpCode -Url "http://localhost:$port$path"
      if ($code -gt 0) { $statusTxt = "HTTP $code" }
    }
    if ($listening) {
      $script:up++
      $mark = 'UP  '; $color = 'Green'
    } else {
      $script:down++
      $mark = 'DOWN'; $color = 'Red'
    }
    $url = "http://localhost:$port"
    $line = "  [{0}] {1,-26} {2,-28} {3}" -f $mark, $name, $url, $statusTxt
    Write-Host $line -ForegroundColor $color
  }
}

Write-Host ""
Write-Host "  BAALVION LOCAL STACK - HEALTH CHECK" -ForegroundColor White
Write-Host ("  mode: " + ($(if ($Http) {'TCP + HTTP'} else {'TCP listen only (pass -Http for status codes)'})))

Show-Group -Title "INFRASTRUCTURE (Docker)" -Items $infra
Show-Group -Title "BACKEND APIs"            -Items $backends
Show-Group -Title "FRONTEND APPS"           -Items $frontends

Write-Host ""
Write-Host ("  SUMMARY: {0} up / {1} down" -f $up, $down) -ForegroundColor White
Write-Host "  Note: a UP frontend may still be compiling on first hit (Next.js dev)." -ForegroundColor DarkGray
Write-Host ""
