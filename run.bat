@echo off
echo.
echo [1/2] Cleaning up old server processes...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/2] Starting PassionForge Backend...
echo ------------------------------------------
echo.
python Backend/app.py
echo.
pause
