@echo off
REM Start FinFlow Frontend and Backend

echo Starting FinFlow Frontend...
start cmd /k "cd /d e:\finflow(github)\finflow-frontend && npm run dev"

echo Waiting 5 seconds before starting backend...
timeout /t 5

echo Starting FinFlow Backend...
start cmd /k "cd /d e:\finflow(github)\finflow_backend-main && call start-local.ps1"

echo.
echo Frontend should be running at: http://localhost:5173
echo Backend services starting (check individual windows)...
pause
