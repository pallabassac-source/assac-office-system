@echo off
setlocal enabledelayedexpansion
title ASSAC Attendance System - Database & Uploads Backup
echo ========================================================
echo   Backing up Database & Uploads from Docker Container
echo ========================================================
echo.

if not exist "backups" mkdir backups

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set datetime=%%I
if "%datetime%"=="" (
    set ts=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set ts=!ts: =0!
) else (
    set ts=%datetime:~0,8%_%datetime:~8,6%
)

set DB_DEST=backups\attendance_backup_!ts!.db
set UPLOADS_DEST=backups\uploads_backup_!ts!

echo Copying SQLite database from assac_backend_api...
docker cp assac_backend_api:/app/data/attendance.db "!DB_DEST!" 2>nul

if exist "!DB_DEST!" (
    echo [OK] Database backup saved to: !DB_DEST!
) else (
    echo [WARNING] Could not backup from container directly. Trying local fallback...
    if exist "backend\data\attendance.db" (
        copy "backend\data\attendance.db" "!DB_DEST!" >nul
        echo [OK] Local database backup saved to: !DB_DEST!
    )
)

echo Copying uploads directory...
docker cp assac_backend_api:/app/uploads "!UPLOADS_DEST!" 2>nul
if exist "!UPLOADS_DEST!" (
    echo [OK] Uploads backup saved to: !UPLOADS_DEST!
)

echo.
echo ========================================================
echo   Backup operation finished!
echo ========================================================
echo.
pause
