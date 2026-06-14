# ─────────────────────────────────────────────────────────────────────────────
# setup-hosts.ps1 — add the Baalvion local domains to the Windows hosts file.
# MUST be run from an ELEVATED (Administrator) PowerShell.
#
#   Right-click PowerShell → "Run as administrator", then:
#   & "D:\Baalvion Projects\local-env\setup-hosts.ps1"
#
# Maps every domain to 127.0.0.1 (IPv4) on purpose: the reverse proxy binds IPv4
# :80, while Docker Desktop holds IPv6 :::80. Re-runnable (idempotent).
# ─────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'

$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
$marker = '# === Baalvion local env ==='
$domains = @(
  'imperialpedia.local',
  'admin.baalvion.local',
  'admin.baalvion.com',
  'ir.baalvion.local',
  'api.baalvion.local',
  # Vite SPAs — For Investors and Founders (:8082) + Proxy BaalvionStack (:8080)
  'founders.baalvion.local',
  'founders.baalvion.com',
  'proxy.baalvionstack.local',
  'proxy.baalvionstack.com'
)

# Elevation check
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Error "This script must be run as Administrator (it edits $hostsPath)."
  exit 1
}

$content = Get-Content $hostsPath -Raw

# Strip any previous managed block so re-runs stay clean.
$pattern = [regex]::Escape($marker) + '.*?' + [regex]::Escape('# === end Baalvion ===')
$content = [regex]::Replace($content, $pattern, '', 'Singleline').TrimEnd()

$block = "`r`n$marker`r`n"
foreach ($d in $domains) { $block += "127.0.0.1`t$d`r`n" }
$block += "# === end Baalvion ===`r`n"

Set-Content -Path $hostsPath -Value ($content + "`r`n" + $block) -Encoding ASCII
Write-Host "Hosts file updated:" -ForegroundColor Green
$domains | ForEach-Object { Write-Host "   127.0.0.1  $_" }

# Flush DNS so the new names resolve immediately.
ipconfig /flushdns | Out-Null
Write-Host "DNS cache flushed. Done." -ForegroundColor Green
