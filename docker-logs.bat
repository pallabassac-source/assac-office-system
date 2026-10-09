@echo off
title ASSAC Attendance System - Live Logs
echo ========================================================
echo   Viewing Live Container Logs (Press Ctrl+C to exit)
echo ========================================================
echo.

docker compose logs -f
