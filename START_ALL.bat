@echo off
cd /d "%~dp0"

echo ==========================================
echo    FINFLOW SYSTEM STARTUP
echo    (Please ensure you ran this as Admin)
echo ==========================================

echo Starting MySQL...
net start MySQL80 >nul 2>&1

echo Starting Redis...
net start Redis >nul 2>&1

echo Starting RabbitMQ...
net start RabbitMQ >nul 2>&1

echo.
echo Starting FinFlow Frontend...
start cmd /k "cd /d "%~dp0finflow-frontend" && npm run dev"

echo Waiting 5 seconds before starting backend...
timeout /t 5

echo Starting FinFlow Backend...
start cmd /k "cd /d "%~dp0finflow-backend" && powershell -ExecutionPolicy Bypass -File start-local.ps1"

echo Opening FinFlow in your browser...
timeout /t 3
start http://localhost:5173

echo.
echo ==========================================
echo    SYSTEM INITIATED SUCCESSFULLY
echo ==========================================
pause
