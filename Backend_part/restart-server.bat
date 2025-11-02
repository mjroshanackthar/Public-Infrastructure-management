@echo off
echo ========================================
echo Restarting Backend Server
echo ========================================
echo.
echo Stopping any running instances...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *npm start*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
echo ========================================
echo.

npm start

pause