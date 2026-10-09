@echo off
title ASSAC Attendance System - Docker Restart
echo ========================================================
echo   Restarting ASSAC Attendance System Containers
echo ========================================================
echo.

docker compose down
docker compose up -d --build

echo.
echo Containers restarted successfully!
echo Web Portal: http://localhost
echo.
pause
