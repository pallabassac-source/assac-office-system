@echo off
title ASSAC Attendance System - Frontend Dev Server
echo ========================================================
echo   Starting Frontend Dev Server (Vite)
echo ========================================================
echo.
cd /d "%~dp0frontend"
npm run dev -- --host
pause
