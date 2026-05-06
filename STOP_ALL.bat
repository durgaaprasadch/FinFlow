@echo off
cd /d "%~dp0"

echo ==========================================
echo    SHUTTING DOWN FINFLOW SYSTEM...
echo ==========================================

echo Stopping Frontend (Node.js)...
taskkill /F /IM node.exe /T >nul 2>&1

echo Stopping Backend (Java)...
taskkill /F /IM java.exe /T >nul 2>&1

echo Stopping MySQL...
net stop MySQL80 >nul 2>&1

echo Stopping Redis...
net stop Redis >nul 2>&1

echo Stopping RabbitMQ...
net stop RabbitMQ >nul 2>&1

echo.
echo ==========================================
echo    ALL SERVICES STOPPED SUCCESSFULLY
echo ==========================================
pause
