# Campus Neighbor - Full Test Suite Automation
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "             CAMPUS NEIGHBOR - AUTOMATED TEST RUNNER                   " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$RootDir = Split-Path -Parent $PSScriptRoot
$PythonPath = "python"
if (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe") {
    $PythonPath = "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe"
}

Write-Host "`n[1/3] Running AI Service Unit & Integration Tests..." -ForegroundColor Yellow
$env:PYTHONPATH = "$RootDir\ai_service"
& $PythonPath -m pytest -p no:asyncio "$RootDir\ai_service\tests" -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] AI Service tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Running Backend API & Repository Tests..." -ForegroundColor Yellow
$env:PYTHONPATH = "$RootDir\backend"
& $PythonPath -m pytest -p no:asyncio "$RootDir\backend\tests" -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] Running Frontend TypeScript Verification and Production Build..." -ForegroundColor Yellow
Set-Location "$RootDir\frontend"
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend build verification failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] All Backend, AI Service, and Frontend verifications passed! " -ForegroundColor Green
Write-Host "======================================================================`n" -ForegroundColor Green
