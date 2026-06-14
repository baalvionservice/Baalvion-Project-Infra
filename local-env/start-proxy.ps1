# start-proxy.ps1 — run the local reverse proxy on IPv4 :80.
# Binding :80 on Windows does NOT require admin (Node uses winsock, not http.sys).
# Override the port with:  $env:PROXY_PORT = '8080'; .\start-proxy.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Starting Baalvion reverse proxy..." -ForegroundColor Cyan
node "$here\reverse-proxy.mjs"
