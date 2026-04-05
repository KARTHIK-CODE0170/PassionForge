@echo off
echo.
echo [1/3] Cleaning up old server processes...
tasklist /FI "IMAGENAME eq python.exe" 2>nul | find /I /N "python.exe" >nul
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM python.exe 2>nul
    timeout /t 1 /nobreak >nul
) else (
    echo [OK] No existing python processes found.
)

echo [2/3] Opening PassionForge in your browser...
start http://localhost:5000

echo [3/3] Starting PassionForge Backend...
echo ------------------------------------------
echo.
"%USERPROFILE%\anaconda3\python.exe" Backend/app.py
echo.
pause
exit /b 0
