@echo off
title CampusNeighbor Launcher
echo ========================================================
echo Launching CampusNeighbor Marketplace (Server + Client)
echo ========================================================

echo 1. Starting Backend API Server (Port 5001)...
start "CampusNeighbor Server" cmd /k "cd /d "%~dp0server" && node src/index.js"

timeout /t 2 /nobreak >nul

echo 2. Starting Frontend Client (Port 5173)...
start "CampusNeighbor Client" cmd /k "cd /d "%~dp0client" && npm.cmd run dev"

echo.
echo Both services are starting in separate windows!
echo - API Server: http://localhost:5001
echo - Frontend App: http://localhost:5173
echo.
pause
