@echo off
title CampusNeighbor - GitHub Uploader
echo ========================================================
echo Pushing CampusNeighbor Marketplace to GitHub
echo Repository: https://github.com/rounakstudent2-hub/campus-neighbour
echo ========================================================
echo.
cd /d "%~dp0"
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo SUCCESS! Repository uploaded successfully to:
    echo https://github.com/rounakstudent2-hub/campus-neighbour
    echo ========================================================
) else (
    echo ========================================================
    echo Notice: If authentication failed, please ensure you are
    echo signed into GitHub or provide a Personal Access Token.
    echo ========================================================
)
echo.
pause
