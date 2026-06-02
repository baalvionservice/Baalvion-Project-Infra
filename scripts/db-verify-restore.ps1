#Requires -Version 5.1
<#
  db-verify-restore.ps1 — PROVE a restore matches what was backed up, row-for-row.
  Compares the restored DB's exact per-table COUNT(*) against the backup MANIFEST's
  point-in-time row counts (NOT the live source, which keeps moving). Bidirectional:
  fails on any missing table, extra table, or count mismatch — except a tiny skew on
  volatile telemetry tables (metrics/heartbeat/_log), which is reported as INFO drift
  (the manifest counts run ~1s after the dump, so a hot append-only table can tick once).
  Run:  pwsh -File scripts/db-verify-restore.ps1
#>
[CmdletBinding()]
param(
  [string]$Container    = 'baalvion-postgres',
  [string]$DbUser       = 'baalvion',
  [string]$DbPass       = 'baalvion_dev_pass',
  [string]$TargetDb     = 'baalvion_restore_test',
  [string]$ManifestFile,
  [string]$BackupDir    = (Join-Path $PSScriptRoot '..\backups'),
  [int]   $VolatileSkew = 5   # max tolerated row diff on volatile telemetry tables
)
$ErrorActionPreference = 'Stop'
$envArgs = @('exec', '-e', "PGPASSWORD=$DbPass", $Container)

if (-not $ManifestFile) {
  $BackupDir = (Resolve-Path -LiteralPath $BackupDir).Path
  $m = Get-ChildItem -LiteralPath $BackupDir -Filter '*_baalvion_db.manifest.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $m) { throw "No manifest in $BackupDir — run db-backup.ps1 first." }
  $ManifestFile = $m.FullName
}
$manifest = Get-Content -LiteralPath $ManifestFile -Raw | ConvertFrom-Json
$src = @{}; ($manifest.rowCounts | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $src[$_.Name] = [int64]$_.Value }

# Same MVCC-consistent per-table count over the restored DB.
$rowSql = "SELECT COALESCE(json_object_agg(tbl, n)::text,'{}') FROM (SELECT format('%s.%s', schemaname, tablename) AS tbl, (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) AS count FROM %I.%I', schemaname, tablename), false, true, '')))[1]::text::bigint AS n FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')) z;"
$dstJson = (& docker @envArgs psql -U $DbUser -d $TargetDb -tAc $rowSql).Trim()
$dst = @{}; ($dstJson | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $dst[$_.Name] = [int64]$_.Value }

Write-Host "[verify] manifest '$(Split-Path $ManifestFile -Leaf)' tables=$($src.Count)  restored '$TargetDb' tables=$($dst.Count)"
$isVolatile = { param($t) $t -match '(metric|telemetry|heartbeat|_log$|_logs$|healthcheck)' }

$fail = $false; $drift = 0; $rows = 0
foreach ($k in ($src.Keys | Sort-Object)) {
  $s = $src[$k]; $rows += $s
  $d = if ($dst.ContainsKey($k)) { $dst[$k] } else { -1 }
  if ($s -eq $d) { continue }
  if ($d -ge 0 -and (& $isVolatile $k) -and ([math]::Abs($s - $d) -le $VolatileSkew)) {
    Write-Host ("  INFO drift (volatile) {0}: backup={1} restored={2}" -f $k, $s, $d) -ForegroundColor Yellow; $drift++
  } else {
    Write-Host ("  MISMATCH {0}: backup={1} restored={2}" -f $k, $s, ($(if ($d -lt 0) { '<MISSING>' } else { $d }))) -ForegroundColor Red; $fail = $true
  }
}
foreach ($k in ($dst.Keys | Sort-Object)) { if (-not $src.ContainsKey($k)) { Write-Host "  EXTRA in restore: $k=$($dst[$k])" -ForegroundColor Red; $fail = $true } }

if ($fail) { Write-Error "[verify] FAILED — restore does not match the backup manifest."; exit 1 }
$msg = "[verify] PASS — all $($src.Count) tables match the backup point-in-time ($rows rows)"
if ($drift -gt 0) { $msg += "; $drift volatile telemetry table(s) within +/-$VolatileSkew skew" }
Write-Host "$msg." -ForegroundColor Green
