@echo off
echo Starting CampusNeighbor API Server on Port 5001...
cd /d "%~dp0server"
node src/index.js
pause
