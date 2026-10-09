@echo off
title ASSAC Attendance System - Docker Stop
echo ========================================================
echo   Stopping ASSAC Attendance System Containers
echo ========================================================
echo.

docker compose down

echo.
echo Containers have been stopped safely. Data volumes remain preserved.
echo.
pause
