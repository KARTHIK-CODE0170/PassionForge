@echo off
echo.
echo [1/3] Cleaning up old server processes...
taskkill /F /IM python.exe 2>nul
timeout /t 1 /nobreak >nul

echo [2/3] Opening PassionForge in your browser...
start http://localhost:5000

echo [3/3] Starting PassionForge Backend...
echo ------------------------------------------
echo.
python Backend/app.py
echo.
pause
