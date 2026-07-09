@echo off
setlocal enabledelayedexpansion
title PillSync - Starting All Services
color 0A
cls

echo.
echo  =====================================================
echo   PILLSYNC - Intelligent Medicine Reminder System
echo  =====================================================
echo.
echo  [*] Starting all services. Please wait...
echo.

REM -------------------------------------------------------
REM STEP 1: Start PostgreSQL inside WSL
REM -------------------------------------------------------
echo  [1/5] Starting PostgreSQL database...
wsl bash -c "pg_ctlcluster 16 main start 2>/dev/null; sleep 2; pg_isready -h 127.0.0.1 -p 5432 -q && echo PG_OK" > "%TEMP%\pillsync_pg.txt" 2>&1
findstr /C:"PG_OK" "%TEMP%\pillsync_pg.txt" >nul 2>&1
if errorlevel 1 (
    echo  [!] Retrying PostgreSQL...
    wsl bash -c "pg_ctlcluster 16 main start 2>/dev/null; sleep 4; pg_isready -h 127.0.0.1 -p 5432 -q && echo PG_OK" > "%TEMP%\pillsync_pg.txt" 2>&1
    findstr /C:"PG_OK" "%TEMP%\pillsync_pg.txt" >nul 2>&1
    if errorlevel 1 (
        color 0C
        echo.
        echo  [ERROR] PostgreSQL failed to start!
        echo  Ensure WSL is installed and working.
        pause
        exit /b 1
    )
)
echo  [1/5] PostgreSQL is running.                        [OK]

REM -------------------------------------------------------
REM STEP 2: Start FastAPI Backend (persistent WSL window)
REM -------------------------------------------------------
echo  [2/5] Starting FastAPI Backend on port 8000...
start "PillSync Backend" wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && ./venv_wsl/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Wait up to 30 seconds for backend to be ready
set BACKEND_READY=0
for /L %%i in (1,1,30) do (
    if !BACKEND_READY!==0 (
        wsl bash -c "curl -s -o /dev/null -w %%{http_code} http://127.0.0.1:8000/ 2>/dev/null" > "%TEMP%\pillsync_back.txt" 2>&1
        findstr /C:"200" "%TEMP%\pillsync_back.txt" >nul 2>&1
        if not errorlevel 1 (
            set BACKEND_READY=1
        ) else (
            timeout /t 1 /nobreak >nul
        )
    )
)
if !BACKEND_READY!==0 (
    color 0C
    echo.
    echo  [ERROR] Backend did not start in time!
    echo  Check the "PillSync Backend" window for error details.
    pause
    exit /b 1
)
echo  [2/5] FastAPI Backend is running on port 8000.     [OK]

REM -------------------------------------------------------
REM STEP 3: Check frontend dependencies
REM -------------------------------------------------------
echo  [3/5] Checking frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo  [3/5] Installing npm packages (first-time only, please wait)...
    cd /d "%~dp0frontend"
    npm install --silent
    cd /d "%~dp0"
    echo  [3/5] npm install complete.
)
echo  [3/5] Frontend dependencies ready.                 [OK]

REM -------------------------------------------------------
REM STEP 4: Start React Frontend (persistent cmd window)
REM -------------------------------------------------------
echo  [4/5] Starting React Frontend on port 5173...
start "PillSync Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

REM Wait up to 20 seconds for frontend
set FRONTEND_READY=0
for /L %%i in (1,1,20) do (
    if !FRONTEND_READY!==0 (
        powershell -Command "try{(New-Object Net.WebClient).DownloadString('http://localhost:5173') | Out-Null; Write-Output 'READY'}catch{Write-Output 'WAIT'}" > "%TEMP%\pillsync_front.txt" 2>&1
        findstr /C:"READY" "%TEMP%\pillsync_front.txt" >nul 2>&1
        if not errorlevel 1 (
            set FRONTEND_READY=1
        ) else (
            timeout /t 1 /nobreak >nul
        )
    )
)
echo  [4/5] React Frontend is running on port 5173.      [OK]

REM -------------------------------------------------------
REM STEP 5: Open Browser
REM -------------------------------------------------------
echo  [5/5] Opening browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"

REM -------------------------------------------------------
REM Success Screen
REM -------------------------------------------------------
cls
echo.
echo  =====================================================
echo       PILLSYNC IS RUNNING SUCCESSFULLY!
echo  =====================================================
echo.
echo    Frontend  :  http://localhost:5173
echo    Backend   :  http://localhost:8000
echo    API Docs  :  http://localhost:8000/docs
echo.
echo  -----------------------------------------------------
echo    LOGIN CREDENTIALS
echo  -----------------------------------------------------
echo    Admin     :  admin@pillsync.com        / admin123
echo    Patient   :  rahul.sharma@pillsync.com / password123
echo    Caregiver :  ramesh.kumar@pillsync.com / password123
echo  -----------------------------------------------------
echo.
echo    Two windows are open:
echo     - "PillSync Backend"  (do NOT close while using app)
echo     - "PillSync Frontend" (do NOT close while using app)
echo.
echo    To STOP everything, run:  stop_project.bat
echo.
echo    Press any key to close this launcher window.
echo.
pause >nul
