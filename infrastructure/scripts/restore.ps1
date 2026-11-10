<#
.SYNOPSIS
    MediNex Database Restore Script.
#>
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$ContainerName = "medinex-postgres",
    [string]$DbName = "medinex_db",
    [string]$DbUser = "medinex_user"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file '$BackupFile' does not exist."
}

Write-Host "[$((Get-Date).ToString('u'))] Restoring database '$DbName' from '$BackupFile'..." -ForegroundColor Yellow

Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName

Write-Host "[$((Get-Date).ToString('u'))] Database restoration completed successfully." -ForegroundColor Green
