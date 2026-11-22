@echo off
title PG SOFT Game Server Simulator
echo ===================================================
echo        PG SOFT GAME SERVER BACKEND (PORT 8000)
echo ===================================================
echo Backend API Endpoint: http://localhost:8000/
echo Web API Auth:        http://localhost:8000/web-api/auth/session/v2/verifyOperatorPlayerSession
echo Game Spin API:       http://localhost:8000/game-api/{gameId}/v2/Spin
echo Wallet Balance API:  http://localhost:8000/api/pg/balance
echo God Mode Rigging:    http://localhost:8000/api/pg/god
echo ===================================================
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
