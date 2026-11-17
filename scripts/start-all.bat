@echo off
TITLE Campus Neighbor - Service Launcher
echo ======================================================================
echo           CAMPUS NEIGHBOR PLATFORM - ORCHESTRATION LAUNCHER
echo ======================================================================
echo.
echo [1/3] Starting AI Service on port 8001...
start "CampusNeighbor - AI Service [8001]" cmd /k "cd /d %~dp0..\ai_service && set PYTHONPATH=%~dp0..\ai_service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend API (FastAPI) on port 8000...
start "CampusNeighbor - Backend API [8000]" cmd /k "cd /d %~dp0..\backend && set PYTHONPATH=%~dp0..\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend (Vite) on port 5173...
start "CampusNeighbor - Frontend [5173]" cmd /k "cd /d %~dp0..\frontend && npm.cmd run dev"

echo.
echo ======================================================================
echo   All 3 services have been launched in separate console windows!
echo   - Frontend:       http://localhost:5173
echo   - Backend Docs:   http://localhost:8000/docs
echo   - AI Service:     http://localhost:8001/health
echo ======================================================================
echo.
pause
