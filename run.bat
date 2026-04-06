@echo off
echo.
echo [1/3] Cleaning up old server processes...
taskkill /F /IM python.exe 2>nul >nul

echo [2/3] Starting PassionForge Backend...
echo ------------------------------------------
echo.
:: Start the backend in the background
start /B python Backend/app.py

echo.
echo [3/3] Opening PassionForge in your browser (waiting 3 seconds for server to start)...
:: Using ping for a non-interactive delay
ping 127.0.0.1 -n 4 > nul
start http://localhost:5000

echo.
echo PassionForge is now running! You can visit http://localhost:5000 in your browser.
