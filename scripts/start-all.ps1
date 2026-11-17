# Campus Neighbor - PowerShell Service Launcher
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          CAMPUS NEIGHBOR PLATFORM - ORCHESTRATION LAUNCHER            " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$RootDir = Split-Path -Parent $PSScriptRoot
$PythonPath = "python"
if (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe") {
    $PythonPath = "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe"
}

Write-Host "`n[1/3] Starting AI Service on port 8001..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$RootDir\ai_service`" && set PYTHONPATH=$RootDir\ai_service && `"$PythonPath`" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Backend API (FastAPI) on port 8000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$RootDir\backend`" && set PYTHONPATH=$RootDir\backend && `"$PythonPath`" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting Frontend (Vite) on port 5173..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$RootDir\frontend`" && npm.cmd run dev" -WindowStyle Normal

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "  All services launched successfully in independent consoles:" -ForegroundColor Green
Write-Host "  - Frontend Client:  http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend Swagger:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - AI Microservice:  http://localhost:8001/health" -ForegroundColor White
Write-Host "======================================================================`n" -ForegroundColor Green
