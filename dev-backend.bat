@echo off
title ASSAC Attendance System - Backend Server
echo ========================================================
echo   Starting Backend API Server (Node)
echo ========================================================
echo.
cd /d "%~dp0backend"
node server.js
pause
