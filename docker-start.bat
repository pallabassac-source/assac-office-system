@echo off
title ASSAC Attendance System - Docker Start
echo ========================================================
echo   Starting ASSAC Attendance System via Docker Compose
echo ========================================================
echo.

docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not detected or Docker Desktop is not running!
    echo Please start Docker Desktop and run this script again.
    echo.
    pause
    exit /b 1
)

echo Building and starting containers in background...
docker compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS: Attendance System is running in Docker!
    echo ========================================================
    echo   Frontend Web Portal : http://localhost
    echo   Backend Health Check: http://localhost:5000/api/health
    echo.
    echo   Default Logins:
    echo     - Super Admin : superadmin / super123
    echo     - Office Admin: admin / admin123
    echo     - IMS Admin   : ims / ims123
    echo ========================================================
) else (
    echo.
    echo [ERROR] Failed to start Docker containers. Check Docker Desktop status.
)

echo.
pause
