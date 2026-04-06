@echo off
setlocal
echo.
echo [1/3] Cleaning up...
:: Kill old python processes
taskkill /F /IM python.exe /T 2>nul
:: Wait briefly for processes to terminate
timeout /t 1 /nobreak >nul

echo [2/3] Launching browser in 2 seconds...
:: Run browser in its own background context with delay
start /B cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

echo [3/3] Starting PassionForge Backend Server...
echo ------------------------------------------
echo Server is launching on: http://localhost:8000
echo.
:: Run server globally (blocks the terminal so logs stay visible)
python Backend/main.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Backend crashed or failed to start.
    echo Please ensure dependencies are installed:
    echo pip install -r Backend/requirements.txt
    pause
)
