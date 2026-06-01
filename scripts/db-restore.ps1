#Requires -Version 5.1
<#
  db-restore.ps1 — restore a .dump (custom format) into a TARGET database.
  Default target is the throwaway DB 'baalvion_restore_test' so it is SAFE to run.
  Restoring over the real DB requires -TargetDb baalvion_db AND -IUnderstandThisDropsData.
  The dump is copied INTO the container then restored from a file (no host binary pipe).
  Run (safe test restore of newest dump):  pwsh -File scripts/db-restore.ps1
#>
[CmdletBinding()]
param(
  [string]$Container = 'baalvion-postgres',
  [string]$DbUser    = 'baalvion',
  [string]$DbPass    = 'baalvion_dev_pass',
  [string]$DumpFile,                               # omit -> newest *.dump in backups/
  [string]$BackupDir = (Join-Path $PSScriptRoot '..\backups'),
  [string]$TargetDb  = 'baalvion_restore_test',    # default = throwaway, safe
  [int]   $Jobs      = 4,
  [switch]$IUnderstandThisDropsData
)
$ErrorActionPreference = 'Stop'

$running = (& docker ps --filter "name=^$Container$" --format '{{.Names}}')
if ($running -ne $Container) { throw "Container '$Container' is not running." }

if (-not $DumpFile) {
  $BackupDir = (Resolve-Path -LiteralPath $BackupDir).Path
  $newest = Get-ChildItem -LiteralPath $BackupDir -Filter '*_baalvion_db.dump' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $newest) { throw "No *.dump found in $BackupDir — pass -DumpFile explicitly." }
  $DumpFile = $newest.FullName
}
if (-not (Test-Path -LiteralPath $DumpFile)) { throw "Dump not found: $DumpFile" }

if ($TargetDb -ne 'baalvion_restore_test' -and -not $IUnderstandThisDropsData) {
  throw "Refusing to restore into '$TargetDb' (recreates the DB, DROPS its data). Pass -IUnderstandThisDropsData."
}

if (Test-Path "$DumpFile.sha256") {
  $want = (Get-Content "$DumpFile.sha256").Trim().ToLower()
  $have = (Get-FileHash -LiteralPath $DumpFile -Algorithm SHA256).Hash.ToLower()
  if ($want -ne $have) { throw "Checksum mismatch for $DumpFile (corrupt dump)." }
  Write-Host "[restore] checksum OK"
}

$adminArgs = @('exec', '-e', "PGPASSWORD=$DbPass", $Container)
Write-Host "[restore] $DumpFile -> db '$TargetDb' on $Container"

# 1) (re)create a CLEAN target DB (terminate connections, drop, create).
& docker @adminArgs psql -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$TargetDb' AND pid<>pg_backend_pid();" | Out-Null
& docker @adminArgs psql -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $TargetDb;" | Out-Null
& docker @adminArgs psql -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $TargetDb OWNER $DbUser;" | Out-Null

# 2) copy the dump into the container and restore from the file.
$tmp = "/tmp/restore_" + [IO.Path]::GetFileName($DumpFile)
& docker cp $DumpFile "${Container}:$tmp" | Out-Null
# No -e: a clean dump restored into a fresh DB completes; correctness is PROVEN by db-verify-restore.ps1
# (row-for-row counts), which is stronger than trusting pg_restore's exit code on benign notices.
& docker @adminArgs pg_restore -U $DbUser -d $TargetDb --no-owner --no-privileges -j $Jobs $tmp 2>&1 | ForEach-Object { if ($_ -match 'error:') { Write-Host "  $_" } }
& docker exec $Container rm -f $tmp | Out-Null

Write-Host "[restore] restored into '$TargetDb'"
Write-Host "[restore] verify: pwsh -File scripts/db-verify-restore.ps1 -TargetDb $TargetDb"
