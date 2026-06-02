#Requires -Version 5.1
<#
  db-backup.ps1 — point-in-time backup of the shared baalvion_db (all per-service schemas).
  Runs entirely via `docker exec` against the running postgres container (no host psql needed).
  Produces under backups/:  <ts>_baalvion_db.dump (custom -Fc) + .sql.gz (portable) + .sha256 + .manifest.json
  Binary dumps are written to a file INSIDE the container then `docker cp`'d out — piping binary
  through PowerShell corrupts it, so we never do that.
  Run:  pwsh -File scripts/db-backup.ps1
#>
[CmdletBinding()]
param(
  [string]$Container     = 'baalvion-postgres',
  [string]$DatabaseName  = 'baalvion_db',
  [string]$DbUser        = 'baalvion',
  [string]$DbPass        = 'baalvion_dev_pass',
  [string]$BackupDir     = (Join-Path $PSScriptRoot '..\backups'),
  [int]   $RetentionDays = 14
)
$ErrorActionPreference = 'Stop'

$running = (& docker ps --filter "name=^$Container$" --format '{{.Names}}')
if ($running -ne $Container) { throw "Container '$Container' is not running. Start it: docker compose up -d postgres" }

$BackupDir = (Resolve-Path -LiteralPath (New-Item -ItemType Directory -Force -Path $BackupDir)).Path
$ts        = Get-Date -Format 'yyyyMMdd_HHmmss'
$base      = "${ts}_${DatabaseName}"
$dumpHost  = Join-Path $BackupDir "$base.dump"
$sqlGzHost = Join-Path $BackupDir "$base.sql.gz"
$manFile   = Join-Path $BackupDir "$base.manifest.json"
$tmpDump   = "/tmp/$base.dump"
$tmpGz     = "/tmp/$base.sql.gz"
$envArgs   = @('exec', '-e', "PGPASSWORD=$DbPass", $Container)

Write-Host "[backup] $DatabaseName from $Container -> $BackupDir"

# 1) custom-format (-Fc) dump to a file in the container, then copy out.
& docker @envArgs pg_dump -U $DbUser -d $DatabaseName -Fc --no-owner --no-privileges -f $tmpDump
if ($LASTEXITCODE -ne 0) { throw 'pg_dump (custom format) failed.' }
& docker cp "${Container}:$tmpDump" $dumpHost | Out-Null
& docker exec $Container rm -f $tmpDump | Out-Null
if (-not (Test-Path $dumpHost) -or (Get-Item $dumpHost).Length -eq 0) { throw 'custom dump not produced/copied.' }

# 2) plain SQL gzipped (portable fallback) — gzip inside the container.
& docker @envArgs sh -c "pg_dump -U $DbUser -d $DatabaseName --no-owner --no-privileges | gzip -9 > $tmpGz"
if ($LASTEXITCODE -ne 0) { throw 'pg_dump (sql.gz) failed.' }
& docker cp "${Container}:$tmpGz" $sqlGzHost | Out-Null
& docker exec $Container rm -f $tmpGz | Out-Null

# 3) checksums.
foreach ($f in @($dumpHost, $sqlGzHost)) {
  (Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLower() | Set-Content -LiteralPath "$f.sha256" -Encoding ascii
}

# 4) manifest: per-schema table counts + per-table row counts (point-in-time verification reference).
$countSql = "SELECT COALESCE(json_object_agg(schemaname, n)::text,'{}') FROM (SELECT schemaname, count(*) AS n FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') GROUP BY schemaname) s;"
$tableCounts = (& docker @envArgs psql -U $DbUser -d $DatabaseName -tAc $countSql).Trim()
# One MVCC-consistent query: exact COUNT(*) for every table as a JSON map {schema.table: n}.
$rowSql = "SELECT COALESCE(json_object_agg(tbl, n)::text,'{}') FROM (SELECT format('%s.%s', schemaname, tablename) AS tbl, (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) AS count FROM %I.%I', schemaname, tablename), false, true, '')))[1]::text::bigint AS n FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')) z;"
$rowCounts = (& docker @envArgs psql -U $DbUser -d $DatabaseName -tAc $rowSql).Trim()
$manifest = [ordered]@{
  database = $DatabaseName; container = $Container; createdAt = (Get-Date).ToString('o')
  dumpFile = (Split-Path $dumpHost -Leaf); sqlGzFile = (Split-Path $sqlGzHost -Leaf)
  dumpSha256 = (Get-Content "$dumpHost.sha256"); dumpBytes = (Get-Item $dumpHost).Length
  tablesPerSchema = $tableCounts; rowCounts = $rowCounts
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manFile -Encoding utf8

# 5) retention prune.
if ($RetentionDays -gt 0) {
  $cutoff = (Get-Date).AddDays(-$RetentionDays)
  Get-ChildItem -LiteralPath $BackupDir -File |
    Where-Object { $_.Name -match '_baalvion_db\.(dump|sql\.gz|manifest\.json)(\.sha256)?$' -and $_.LastWriteTime -lt $cutoff } |
    ForEach-Object { Write-Host "[backup] prune $($_.Name)"; Remove-Item -LiteralPath $_.FullName -Force }
}

Write-Host "[backup] OK"
Write-Host "  dump    : $dumpHost ($([math]::Round((Get-Item $dumpHost).Length/1KB,1)) KB)"
Write-Host "  sqlgz   : $sqlGzHost"
Write-Host "  manifest: $manFile"
