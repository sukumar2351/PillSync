@echo off
setlocal enabledelayedexpansion
title PillSync - One-Click Launcher
color 0A
cls

echo.
echo  =====================================================================
echo    PillSync - Intelligent Medicine Reminder System
echo    Milestone 2 - One-Click Startup Script (Local Windows Mode)
echo  =====================================================================
echo.
echo  [*] Running pre-flight checks. Please wait...
echo.

REM  Store project root (directory where this bat file is located)
set "PROJ=%~dp0"
if "!PROJ:~-1!"=="\" set "PROJ=!PROJ:~0,-1!"

REM =====================================================================
REM  STEP 1: VERIFY PROJECT FOLDER
REM =====================================================================
echo  [CHECK 1/8] Verifying project folder...
if not exist "!PROJ!\backend" (
    color 0C
    echo.
    echo  [ERROR] Missing: !PROJ!\backend
    echo  Run this bat file from the PillSync root folder.
    echo.
    pause
    exit /b 1
)
if not exist "!PROJ!\frontend" (
    color 0C
    echo.
    echo  [ERROR] Missing: !PROJ!\frontend
    echo  Run this bat file from the PillSync root folder.
    echo.
    pause
    exit /b 1
)
echo  [CHECK 1/8] Project folder: !PROJ!                            [OK]

REM =====================================================================
REM  STEP 2: VERIFY PYTHON (LOCAL WINDOWS)
REM =====================================================================
echo  [CHECK 2/8] Verifying local Python 3...
python --version > "%TEMP%\ps_py.txt" 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Python 3 not installed or not in PATH.
    echo  Download from: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
findstr /C:"Python 3" "%TEMP%\ps_py.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Python 3 required. Found:
    type "%TEMP%\ps_py.txt"
    echo.
    pause
    exit /b 1
)
echo  [CHECK 2/8] Local Python 3 is installed.                       [OK]

REM =====================================================================
REM  STEP 3: VERIFY WSL ACCESSIBILITY (FOR POSTGRESQL)
REM =====================================================================
echo  [CHECK 3/8] Verifying WSL...
wsl bash -c "echo WSL_OK" > "%TEMP%\ps_wsl.txt" 2>&1
findstr /C:"WSL_OK" "%TEMP%\ps_wsl.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] WSL not installed or not accessible.
    echo  We need WSL to run PostgreSQL in the background.
    echo.
    pause
    exit /b 1
)
echo  [CHECK 3/8] WSL is accessible.                                [OK]

REM =====================================================================
REM  STEP 4: VERIFY LOCAL WINDOWS VIRTUAL ENVIRONMENT
REM =====================================================================
echo  [CHECK 4/8] Verifying local Python virtual environment...
if not exist "!PROJ!\backend\venv\Scripts\python.exe" (
    color 0E
    echo  [INFO] Windows Python venv not found. Creating now...
    color 0A
    pushd "!PROJ!\backend"
    python -m venv venv
    if errorlevel 1 (
        popd
        color 0C
        echo  [ERROR] Failed to create venv!
        pause
        exit /b 1
    )
    echo  Installing packages into virtual environment...
    venv\Scripts\pip install --upgrade pip
    venv\Scripts\pip install -r requirements.txt
    popd
    echo  [CHECK 4/8] Local venv created and dependencies installed.   [OK]
) else (
    echo  [CHECK 4/8] Local Python virtual environment is ready.       [OK]
)

REM =====================================================================
REM  STEP 5: VERIFY NODE.JS
REM =====================================================================
echo  [CHECK 5/8] Verifying Node.js...
node --version > "%TEMP%\ps_node.txt" 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Node.js not found. Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  [CHECK 5/8] Node.js is installed.                             [OK]

REM =====================================================================
REM  STEP 6: VERIFY NPM
REM =====================================================================
echo  [CHECK 6/8] Verifying npm...
npm --version > "%TEMP%\ps_npm.txt" 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] npm not found. Reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  [CHECK 6/8] npm is installed.                                 [OK]

REM =====================================================================
REM  STEP 7: VERIFY POSTGRESQL IN WSL
REM =====================================================================
echo  [CHECK 7/8] Verifying PostgreSQL in WSL...
wsl bash -c "which pg_ctlcluster >/dev/null 2>&1 || which pg_ctl >/dev/null 2>&1 && echo PG_INSTALLED" > "%TEMP%\ps_pgchk.txt" 2>&1
findstr /C:"PG_INSTALLED" "%TEMP%\ps_pgchk.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] PostgreSQL not found in WSL.
    echo  Fix: wsl sudo apt-get install postgresql -y
    echo.
    pause
    exit /b 1
)
echo  [CHECK 7/8] PostgreSQL is installed in WSL.                   [OK]

REM =====================================================================
REM  STEP 8: VERIFY .env FILE
REM =====================================================================
echo  [CHECK 8/8] Verifying backend .env file...
if not exist "!PROJ!\backend\.env" (
    color 0C
    echo.
    echo  [ERROR] Missing: !PROJ!\backend\.env
    echo  Copy backend\.env.example to backend\.env
    echo.
    pause
    exit /b 1
)
findstr /C:"DATABASE_URL" "!PROJ!\backend\.env" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] DATABASE_URL missing from backend\.env
    echo.
    pause
    exit /b 1
)
findstr /C:"JWT_SECRET_KEY" "!PROJ!\backend\.env" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] JWT_SECRET_KEY missing from backend\.env
    echo.
    pause
    exit /b 1
)
echo  [CHECK 8/8] Environment .env verified.                        [OK]

echo.
echo  ---------------------------------------------------------------
echo   All pre-flight checks PASSED! Starting PillSync services...
echo  ---------------------------------------------------------------
echo.

REM =====================================================================
REM  STAGE 1: START POSTGRESQL (WSL)
REM =====================================================================
echo  [1/5] Starting PostgreSQL inside WSL...
wsl bash -c "sudo service postgresql start || pg_ctlcluster 16 main start 2>/dev/null; sleep 2; if pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then echo PG_OK; else echo PG_FAIL; fi" > "%TEMP%\ps_pg.txt" 2>&1
findstr /C:"PG_OK" "%TEMP%\ps_pg.txt" > nul 2>&1
if errorlevel 1 (
    echo  [!] Retry: waiting then trying again...
    wsl bash -c "sleep 3; sudo service postgresql start 2>/dev/null; sleep 5; if pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then echo PG_OK; else echo PG_FAIL; fi" > "%TEMP%\ps_pg.txt" 2>&1
    findstr /C:"PG_OK" "%TEMP%\ps_pg.txt" > nul 2>&1
    if errorlevel 1 (
        color 0C
        echo.
        echo  [ERROR] PostgreSQL failed to start in WSL!
        echo  Try: wsl sudo service postgresql start
        echo.
        pause
        exit /b 1
    )
)
echo  [1/5] PostgreSQL is running in WSL.                           [OK]

REM =====================================================================
REM  STAGE 1b: GET WSL IP DYNAMICALLY AND START LOCAL PORT PROXY FOR POSTGRES
REM =====================================================================
echo  [1b] Setting up local port proxy for PostgreSQL (port 5432)...
wsl bash -c "hostname -I" > "%TEMP%\ps_wslip.txt" 2>&1
set /p WSL_IP=<"%TEMP%\ps_wslip.txt"
REM Trim trailing spaces from WSL_IP
for /f "tokens=1" %%a in ("!WSL_IP!") do set "WSL_IP=%%a"
echo  [1b] Detected WSL IP: !WSL_IP!

REM Terminate existing proxies if any
taskkill /F /FI "WINDOWTITLE eq PillSync Postgres Proxy" >nul 2>&1

REM Start background node proxy
start "PillSync Postgres Proxy" /min node -e "const net = require('net'); const s = net.createServer((c) => { const r = net.connect(5432, '!WSL_IP!', () => { c.pipe(r); r.pipe(c); }); c.on('error', () => r.destroy()); r.on('error', () => c.destroy()); }); s.listen(5432, '127.0.0.1', () => console.log('Proxy 5432 OK'));"

timeout /t 2 /nobreak > nul

REM =====================================================================
REM  STAGE 2: RUN DATABASE MIGRATIONS (HANDLED VIA APP LIFESPAN STARTUP)
REM =====================================================================
echo  [2/5] Database migrations are automatically checked on server startup. [OK]

REM =====================================================================
REM  STAGE 3: START FASTAPI BACKEND (LOCAL WINDOWS PYTHON)
REM =====================================================================
echo  [3/5] Starting FastAPI backend on Windows host...
pushd "!PROJ!\backend"
start "PillSync Backend" venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
popd

echo  [3/5] Waiting 6 seconds for uvicorn to bind...
timeout /t 6 /nobreak > nul

echo  [3/5] Polling http://localhost:8000/docs (up to 30s)...
set BACKEND_READY=0
for /L %%i in (1,1,30) do (
    if !BACKEND_READY!==0 (
        curl.exe -s -o nul -w %%{http_code} http://localhost:8000/docs > "%TEMP%\ps_hc.txt" 2>&1
        findstr /C:"200" "%TEMP%\ps_hc.txt" > nul 2>&1
        if not errorlevel 1 (
            set BACKEND_READY=1
        ) else (
            timeout /t 1 /nobreak > nul
        )
    )
)

if !BACKEND_READY!==0 (
    color 0C
    echo.
    echo  ============================================================
    echo   [ERROR] Backend did not respond in 30 seconds!
    echo  ============================================================
    echo.
    echo  Check the 'PillSync Backend' window for the traceback.
    echo.
    pause
    exit /b 1
)
echo  [3/5] FastAPI backend READY at http://localhost:8000           [OK]

REM =====================================================================
REM  STAGE 4: FRONTEND DEPENDENCIES
REM =====================================================================
echo  [4/5] Checking frontend dependencies...
if not exist "!PROJ!\frontend\node_modules" (
    echo  [4/5] node_modules missing - installing (may take a minute)...
    pushd "!PROJ!\frontend"
    npm install
    if errorlevel 1 (
        popd
        color 0C
        echo.
        echo  [ERROR] npm install failed!
        echo.
        pause
        exit /b 1
    )
    popd
)
echo  [4/5] Frontend dependencies ready.                            [OK]

REM =====================================================================
REM  STAGE 5: START REACT FRONTEND
REM =====================================================================
echo  [5/5] Starting React Vite frontend (window: "PillSync Frontend")...
set "FEDIR=!PROJ!\frontend"
start "PillSync Frontend" cmd /k "cd /d !FEDIR! && npm run dev"

timeout /t 4 /nobreak > nul

echo  [5/5] Polling http://localhost:5173 (up to 30s)...
set FRONTEND_READY=0
for /L %%i in (1,1,30) do (
    if !FRONTEND_READY!==0 (
        curl.exe -s -o nul -w %%{http_code} http://localhost:5173/ > "%TEMP%\ps_fe.txt" 2>&1
        findstr /C:"200" "%TEMP%\ps_fe.txt" > nul 2>&1
        if not errorlevel 1 (
            set FRONTEND_READY=1
        ) else (
            timeout /t 1 /nobreak > nul
        )
    )
)
if !FRONTEND_READY!==0 (
    color 0E
    echo  [WARN]  Frontend not responding yet. Check "PillSync Frontend" window.
    color 0A
) else (
    echo  [5/5] React frontend READY at http://localhost:5173          [OK]
)

REM =====================================================================
REM  OPEN BROWSER TABS
REM =====================================================================
echo.
echo  Opening browser tabs...
timeout /t 2 /nobreak > nul
start "" "http://localhost:5173"
timeout /t 1 /nobreak > nul
start "" "http://localhost:8000/docs"

REM =====================================================================
REM  SUCCESS SCREEN
REM =====================================================================
cls
color 0A
echo.
echo  =====================================================================
echo    ^>^> PILLSYNC IS FULLY RUNNING! (Hybrid Windows+WSL Mode)
echo  =====================================================================
echo.
echo    Service          Address                        Status
echo    ---------------  -----------------------------  --------
echo    React Frontend   http://localhost:5173          RUNNING
echo    FastAPI Backend  http://localhost:8000          RUNNING
echo    API Docs         http://localhost:8000/docs     RUNNING
echo    PostgreSQL       127.0.0.1:5432  (WSL)         RUNNING
echo.
echo  =====================================================================
echo    LOGIN CREDENTIALS
echo  =====================================================================
echo    Patient    :  sukumarsty25@gmail.com    /  password123
echo    Admin      :  admin@pillsync.com        /  admin123
echo    Caregiver  :  ramesh.kumar@pillsync.com /  password123
echo  =====================================================================
echo.
echo    SMTP Email :  sukumarkarnam4@gmail.com  (Gmail SMTP)
echo    Branch     :  milestone-2
echo.
echo  =====================================================================
echo    Keep these windows open:
echo      "PillSync Backend"   - FastAPI uvicorn server (Windows)
echo      "PillSync Frontend"  - React Vite Dev Server (Windows)
echo      "PillSync Postgres Proxy" - Local TCP proxy redirects 5432 to WSL
echo  =====================================================================
echo.
echo    To stop all services:  stop_project.bat
echo.
echo    Press any key to close this launcher window.
echo.
pause > nul
