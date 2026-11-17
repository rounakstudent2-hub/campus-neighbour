@echo off
TITLE Campus Neighbor - Test Suite Runner
echo ======================================================================
echo              CAMPUS NEIGHBOR - AUTOMATED TEST RUNNER
echo ======================================================================
echo.

set ROOT=%~dp0..
set PYTHON_EXE=python
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
)

echo [1/3] Running AI Service Unit & Integration Tests...
set PYTHONPATH=%ROOT%\ai_service
%PYTHON_EXE% -m pytest -p no:asyncio "%ROOT%\ai_service\tests" -v
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] AI Service tests failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Running Backend API & Repository Tests...
set PYTHONPATH=%ROOT%\backend
%PYTHON_EXE% -m pytest -p no:asyncio "%ROOT%\backend\tests" -v
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend tests failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Running Frontend TypeScript Verification and Production Build...
cd /d "%ROOT%\frontend"
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build verification failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ======================================================================
echo  [SUCCESS] All Backend, AI Service, and Frontend verifications passed!
echo ======================================================================
pause
