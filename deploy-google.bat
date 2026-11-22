@echo off
title Deploy Website to Google Firebase
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

echo ===================================================
echo   Google Firebase Hosting Deployer
echo ===================================================
echo.
echo Step 1: Logging in to Google...
call firebase login
if errorlevel 1 (
    echo Login failed or cancelled.
    pause
    exit /b 1
)

echo.
echo Step 2: Selecting Firebase project...
call firebase use --add

echo.
echo Step 3: Deploying files to Google Firebase Hosting...
call firebase deploy --only hosting

echo.
echo ===================================================
echo   DEPLOY FINISHED!
echo ===================================================
echo.
pause
