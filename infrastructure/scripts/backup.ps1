<#
.SYNOPSIS
    Automated PostgreSQL Backup Script for MediNex.
#>
param (
    [string]$ContainerName = "medinex-postgres",
    [string]$DbName = "medinex_db",
    [string]$DbUser = "medinex_user",
    [string]$BackupDir = "./backups"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $BackupDir "medinex_backup_$Timestamp.sql"

Write-Host "[$((Get-Date).ToString('u'))] Starting database backup from container '$ContainerName'..." -ForegroundColor Cyan

docker exec $ContainerName pg_dump -U $DbUser -d $DbName --clean --if-exists --no-owner | Out-File -FilePath $OutputFile -Encoding utf8

if (Test-Path $OutputFile) {
    $Size = (Get-Item $OutputFile).Length / 1KB
    Write-Host "[$((Get-Date).ToString('u'))] Backup completed successfully: $OutputFile ($([Math]::Round($Size, 2)) KB)" -ForegroundColor Green
} else {
    Write-Error "Backup failed; output file was not generated."
}
