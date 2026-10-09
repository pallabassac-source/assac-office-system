<#
.SYNOPSIS
  ASSAC Attendance System - Docker Management CLI Helper
.DESCRIPTION
  Unified script to manage the Docker lifecycle of the Attendance System on Windows.
.EXAMPLE
  .\docker-manage.ps1 start
  .\docker-manage.ps1 stop
  .\docker-manage.ps1 dev
  .\docker-manage.ps1 backup
  .\docker-manage.ps1 logs
  .\docker-manage.ps1 status
#>

param (
    [ValidateSet("start", "stop", "restart", "dev", "backup", "logs", "status", "clean")]
    [string]$Action = "start"
)

function Check-Docker {
    try {
        $null = docker compose version
        $ps = docker ps 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Docker Desktop is installed but the Docker daemon is NOT running." -ForegroundColor Red
            Write-Host "Please start Docker Desktop from your Windows Start Menu and try again." -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "[ERROR] Docker CLI was not found on your PATH." -ForegroundColor Red
        exit 1
    }
}

switch ($Action) {
    "start" {
        Check-Docker
        Write-Host "Starting ASSAC Attendance System (Production Mode)..." -ForegroundColor Cyan
        docker compose up -d --build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n========================================================" -ForegroundColor Green
            Write-Host " SYSTEM ONLINE" -ForegroundColor Green
            Write-Host "========================================================" -ForegroundColor Green
            Write-Host "  Web Portal    : http://localhost" -ForegroundColor White
            Write-Host "  Backend Health: http://localhost:5000/api/health" -ForegroundColor White
            Write-Host "  Credentials   : superadmin / super123  |  admin / admin123" -ForegroundColor DarkCyan
            Write-Host "========================================================`n" -ForegroundColor Green
        }
    }
    "stop" {
        Check-Docker
        Write-Host "Stopping ASSAC Attendance System..." -ForegroundColor Yellow
        docker compose down
        Write-Host "Containers stopped safely. Data volumes preserved." -ForegroundColor Green
    }
    "restart" {
        Check-Docker
        Write-Host "Restarting ASSAC Attendance System..." -ForegroundColor Cyan
        docker compose down
        docker compose up -d --build
    }
    "dev" {
        Check-Docker
        Write-Host "Starting Attendance System in Live Hot-Reload Dev Mode..." -ForegroundColor Magenta
        docker compose -f docker-compose.dev.yml up --build
    }
    "backup" {
        Check-Docker
        $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
        $backupDir = Join-Path $PSScriptRoot "backups"
        if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
        
        $dbDest = Join-Path $backupDir "attendance_backup_$timestamp.db"
        $uploadsDest = Join-Path $backupDir "uploads_backup_$timestamp"

        Write-Host "Creating database backup from container..." -ForegroundColor Cyan
        docker cp "assac_backend_api:/app/data/attendance.db" "$dbDest" 2>$null
        if (Test-Path $dbDest) {
            Write-Host "[OK] Database saved: $dbDest" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Container copy failed. Falling back to host data file..." -ForegroundColor Yellow
            if (Test-Path "backend/data/attendance.db") {
                Copy-Item "backend/data/attendance.db" "$dbDest" -Force
                Write-Host "[OK] Local database backed up: $dbDest" -ForegroundColor Green
            }
        }

        Write-Host "Backing up uploads folder from container..." -ForegroundColor Cyan
        docker cp "assac_backend_api:/app/uploads" "$uploadsDest" 2>$null
        if (Test-Path $uploadsDest) {
            Write-Host "[OK] Uploads directory saved: $uploadsDest" -ForegroundColor Green
        }

        Write-Host "`nBackup completed into: $backupDir" -ForegroundColor Green
    }
    "logs" {
        Check-Docker
        docker compose logs -f
    }
    "status" {
        Check-Docker
        Write-Host "--- Active Docker Containers ---" -ForegroundColor Cyan
        docker compose ps
    }
    "clean" {
        Check-Docker
        Write-Host "Cleaning stopped containers and temporary build caches..." -ForegroundColor Yellow
        docker compose down --remove-orphans
        docker builder prune -f
    }
}
