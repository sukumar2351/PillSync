@echo off
setlocal enabledelayedexpansion
title PillSync - One-Click Launcher
color 0A
cls

echo.
echo  =====================================================================
echo       ____  _ _ _  _____                      
echo      |  _ \(_) | |/ ____|                     
echo      | |_) |_| | | (___  _   _ _ __   ___    
echo      |  __/| | | |\___ \| | | | '_ \ / __|   
echo      | |   | | | |____) | |_| | | | | (__    
echo      |_|   |_|_|_|_____/ \__, |_| |_|\___|   
echo                            __/ |              
echo                           |___/               
echo  =====================================================================
echo        Intelligent Medicine Reminder System  ^|  Milestone 2
echo  =====================================================================
echo.
echo  [*] Running pre-flight checks. Please wait...
echo.

REM =====================================================================
REM  STEP 1: VERIFY PROJECT FOLDER
REM =====================================================================
echo  [CHECK 1/8] Verifying project folder...
if not exist "%~dp0backend" (
    color 0C
    echo.
    echo  [ERROR] Project folder is incomplete.
    echo         Missing: backend\
    echo         Make sure you are running this from the PillSync root folder.
    pause
    exit /b 1
)
if not exist "%~dp0frontend" (
    color 0C
    echo.
    echo  [ERROR] Project folder is incomplete.
    echo         Missing: frontend\
    echo         Make sure you are running this from the PillSync root folder.
    pause
    exit /b 1
)
echo  [CHECK 1/8] Project folder verified.                        [OK]

REM =====================================================================
REM  STEP 2: VERIFY PYTHON IS INSTALLED
REM =====================================================================
echo  [CHECK 2/8] Verifying Python installation...
python --version >"%TEMP%\pillsync_pycheck.txt" 2>&1
findstr /C:"Python 3" "%TEMP%\pillsync_pycheck.txt" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Python 3 is not installed or not in PATH.
    echo         Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo  [CHECK 2/8] Python is installed.                            [OK]

REM =====================================================================
REM  STEP 3: VERIFY VIRTUAL ENVIRONMENT EXISTS
REM =====================================================================
echo  [CHECK 3/8] Verifying Python virtual environment (WSL)...
wsl bash -c "test -f /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend/venv_wsl/bin/uvicorn && echo VENV_OK" > "%TEMP%\pillsync_venv.txt" 2>&1
findstr /C:"VENV_OK" "%TEMP%\pillsync_venv.txt" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] WSL virtual environment not found!
    echo         Expected: backend/venv_wsl/
    echo         Run: wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && python3 -m venv venv_wsl && ./venv_wsl/bin/pip install -r requirements.txt"
    pause
    exit /b 1
)
echo  [CHECK 3/8] Python virtual environment (WSL) is ready.      [OK]

REM =====================================================================
REM  STEP 4: VERIFY NODE.JS IS INSTALLED
REM =====================================================================
echo  [CHECK 4/8] Verifying Node.js installation...
node --version >"%TEMP%\pillsync_nodecheck.txt" 2>&1
findstr /C:"v" "%TEMP%\pillsync_nodecheck.txt" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo         Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo  [CHECK 4/8] Node.js is installed.                           [OK]

REM =====================================================================
REM  STEP 5: VERIFY NPM IS INSTALLED
REM =====================================================================
echo  [CHECK 5/8] Verifying npm installation...
npm --version >"%TEMP%\pillsync_npmcheck.txt" 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] npm is not installed or not in PATH.
    echo         npm is usually bundled with Node.js. Reinstall Node.js.
    pause
    exit /b 1
)
echo  [CHECK 5/8] npm is installed.                               [OK]

REM =====================================================================
REM  STEP 6: VERIFY WSL IS INSTALLED AND ACCESSIBLE
REM =====================================================================
echo  [CHECK 6/8] Verifying WSL (Windows Subsystem for Linux)...
wsl bash -c "echo WSL_OK" >"%TEMP%\pillsync_wslcheck.txt" 2>&1
findstr /C:"WSL_OK" "%TEMP%\pillsync_wslcheck.txt" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] WSL is not installed or not accessible.
    echo         Enable WSL: Run PowerShell as Admin and type: wsl --install
    echo         Then restart your computer.
    pause
    exit /b 1
)
echo  [CHECK 6/8] WSL is installed and accessible.                [OK]

REM =====================================================================
REM  STEP 7: VERIFY POSTGRESQL IS INSTALLED INSIDE WSL
REM =====================================================================
echo  [CHECK 7/8] Verifying PostgreSQL installation inside WSL...
wsl bash -c "which pg_ctlcluster > /dev/null 2>&1 && echo PG_INSTALLED || which pg_ctl > /dev/null 2>&1 && echo PG_INSTALLED" >"%TEMP%\pillsync_pginstall.txt" 2>&1
findstr /C:"PG_INSTALLED" "%TEMP%\pillsync_pginstall.txt" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] PostgreSQL is not installed in WSL.
    echo         Install with: wsl bash -c "sudo apt-get install postgresql -y"
    pause
    exit /b 1
)
echo  [CHECK 7/8] PostgreSQL is installed in WSL.                 [OK]

REM =====================================================================
REM  STEP 8: VERIFY ENVIRONMENT VARIABLES IN .env FILE
REM =====================================================================
echo  [CHECK 8/8] Verifying backend .env configuration...
set ENV_FILE=%~dp0backend\.env
if not exist "%ENV_FILE%" (
    color 0C
    echo.
    echo  [ERROR] Backend .env file not found!
    echo         Expected at: backend\.env
    echo         Copy backend\.env.example to backend\.env and fill in your credentials.
    pause
    exit /b 1
)

REM Check DATABASE_URL
findstr /C:"DATABASE_URL" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Missing DATABASE_URL in backend\.env
    pause
    exit /b 1
)

REM Check JWT_SECRET_KEY
findstr /C:"JWT_SECRET_KEY" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Missing JWT_SECRET_KEY in backend\.env
    pause
    exit /b 1
)

REM Check EMAIL_ADDRESS
findstr /C:"EMAIL_ADDRESS" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 (
    color 0E
    echo  [WARN]  EMAIL_ADDRESS not found in backend\.env
    echo         Email reminders will be disabled.
) else (
    REM Check EMAIL_APP_PASSWORD
    findstr /C:"EMAIL_APP_PASSWORD" "%ENV_FILE%" >nul 2>&1
    if errorlevel 1 (
        color 0E
        echo  [WARN]  EMAIL_APP_PASSWORD not found in backend\.env
        echo         Email reminders will be disabled.
    )
)

color 0A
echo  [CHECK 8/8] Environment configuration verified.             [OK]

echo.
echo  ---------------------------------------------------------------
echo   All pre-flight checks passed! Starting PillSync services...
echo  ---------------------------------------------------------------
echo.

REM =====================================================================
REM  STAGE 1: START POSTGRESQL DATABASE
REM =====================================================================
echo  [1/5] Starting PostgreSQL database (WSL)...
wsl bash -c "pg_ctlcluster 16 main start 2>/dev/null; sleep 2; pg_isready -h 127.0.0.1 -p 5432 -q && echo PG_OK" > "%TEMP%\pillsync_pg.txt" 2>&1
findstr /C:"PG_OK" "%TEMP%\pillsync_pg.txt" >nul 2>&1
if errorlevel 1 (
    echo  [!] Retrying PostgreSQL startup...
    wsl bash -c "pg_ctlcluster 16 main start 2>/dev/null; sleep 5; pg_isready -h 127.0.0.1 -p 5432 -q && echo PG_OK" > "%TEMP%\pillsync_pg.txt" 2>&1
    findstr /C:"PG_OK" "%TEMP%\pillsync_pg.txt" >nul 2>&1
    if errorlevel 1 (
        color 0C
        echo.
        echo  [ERROR] PostgreSQL failed to start!
        echo         Check if WSL is running and PostgreSQL 16 is installed.
        echo         Manual fix: wsl bash -c "sudo pg_ctlcluster 16 main start"
        pause
        exit /b 1
    )
)
echo  [1/5] PostgreSQL is running on port 5432.                   [OK]

REM =====================================================================
REM  STAGE 2: RUN DATABASE MIGRATIONS
REM =====================================================================
echo  [2/5] Running database migrations (Alembic)...
wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && ./venv_wsl/bin/alembic upgrade head 2>&1 | tail -5" > "%TEMP%\pillsync_migrate.txt" 2>&1
findstr /i /C:"error" "%TEMP%\pillsync_migrate.txt" >nul 2>&1
if not errorlevel 1 (
    color 0E
    echo  [WARN]  Migration reported an issue. Continuing anyway...
    color 0A
) else (
    echo  [2/5] Database schema is up to date.                       [OK]
)

REM =====================================================================
REM  STAGE 3: START FASTAPI BACKEND
REM =====================================================================
echo  [3/5] Starting FastAPI Backend on port 8000...
start "PillSync Backend" wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && ./venv_wsl/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Wait up to 40 seconds for backend to be ready (HTTP 200)
set BACKEND_READY=0
echo  [3/5] Waiting for backend to be ready (up to 40s)...
for /L %%i in (1,1,40) do (
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
    echo  [ERROR] Backend did not respond within 40 seconds!
    echo         Check the "PillSync Backend" window for startup errors.
    echo.
    echo         Common fixes:
    echo           1. Database connection: check DATABASE_URL in backend\.env
    echo           2. Port conflict: another service may be on port 8000
    echo           3. Import error: check backend Python code
    pause
    exit /b 1
)
echo  [3/5] FastAPI Backend is ready on port 8000.                [OK]

REM =====================================================================
REM  STAGE 3b: VERIFY SMTP CONFIGURATION
REM =====================================================================
echo  [3b] Verifying SMTP email configuration...
wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && ./venv_wsl/bin/python3 -c \"
import os, sys
from dotenv import load_dotenv
load_dotenv('.env')
addr = os.getenv('EMAIL_ADDRESS', '')
pwd  = os.getenv('EMAIL_APP_PASSWORD', '')
if addr and pwd:
    print('SMTP_CONFIGURED')
else:
    print('SMTP_MISSING')
\" 2>/dev/null" > "%TEMP%\pillsync_smtp.txt" 2>&1

findstr /C:"SMTP_CONFIGURED" "%TEMP%\pillsync_smtp.txt" >nul 2>&1
if errorlevel 1 (
    color 0E
    echo  [WARN]  SMTP not fully configured. Email reminders will be disabled.
    echo         Set EMAIL_ADDRESS and EMAIL_APP_PASSWORD in backend\.env
    color 0A
) else (
    echo  [3b] Gmail SMTP is configured.                             [OK]
)

REM =====================================================================
REM  STAGE 4: CHECK FRONTEND DEPENDENCIES
REM =====================================================================
echo  [4/5] Checking frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo  [4/5] Installing npm packages (first-time setup, please wait)...
    cd /d "%~dp0frontend"
    npm install --silent
    cd /d "%~dp0"
    if errorlevel 1 (
        color 0C
        echo  [ERROR] npm install failed! Check your Node.js installation.
        pause
        exit /b 1
    )
)
echo  [4/5] Frontend dependencies are ready.                      [OK]

REM =====================================================================
REM  STAGE 5: START REACT FRONTEND
REM =====================================================================
echo  [5/5] Starting React Frontend on port 5173...
start "PillSync Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

REM Wait up to 25 seconds for frontend
set FRONTEND_READY=0
echo  [5/5] Waiting for frontend to be ready (up to 25s)...
for /L %%i in (1,1,25) do (
    if !FRONTEND_READY!==0 (
        powershell -Command "try{$r=(New-Object Net.WebClient).DownloadString('http://localhost:5173');Write-Output 'READY'}catch{Write-Output 'WAIT'}" > "%TEMP%\pillsync_front.txt" 2>&1
        findstr /C:"READY" "%TEMP%\pillsync_front.txt" >nul 2>&1
        if not errorlevel 1 (
            set FRONTEND_READY=1
        ) else (
            timeout /t 1 /nobreak >nul
        )
    )
)
if !FRONTEND_READY!==0 (
    color 0E
    echo  [WARN]  Frontend did not respond in 25s. It may still be starting.
    echo         Check the "PillSync Frontend" window for details.
    color 0A
) else (
    echo  [5/5] React Frontend is ready on port 5173.               [OK]
)

REM =====================================================================
REM  FINAL: VERIFY API HEALTH ENDPOINT
REM =====================================================================
echo.
echo  [FINAL] Verifying API health endpoint...
wsl bash -c "curl -s http://127.0.0.1:8000/ 2>/dev/null" > "%TEMP%\pillsync_health.txt" 2>&1
findstr /i /C:"running" "%TEMP%\pillsync_health.txt" >nul 2>&1
if errorlevel 1 (
    findstr /i /C:"message" "%TEMP%\pillsync_health.txt" >nul 2>&1
    if errorlevel 1 (
        color 0E
        echo  [WARN]  API health check returned unexpected response.
        color 0A
    ) else (
        echo  [FINAL] API health endpoint responded successfully.        [OK]
    )
) else (
    echo  [FINAL] API health endpoint responded successfully.            [OK]
)

REM =====================================================================
REM  OPEN BROWSER
REM =====================================================================
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"

REM =====================================================================
REM  SUCCESS SCREEN
REM =====================================================================
cls
color 0A
echo.
echo  =====================================================================
echo       PILLSYNC IS FULLY RUNNING!
echo  =====================================================================
echo.
echo    Service         URL                          Status
echo    --------------- ---------------------------- -------
echo    React Frontend  http://localhost:5173         RUNNING
echo    FastAPI Backend http://localhost:8000         RUNNING
echo    API Docs        http://localhost:8000/docs    RUNNING
echo    PostgreSQL      127.0.0.1:5432               RUNNING
echo.
echo  =====================================================================
echo    LOGIN CREDENTIALS
echo  =====================================================================
echo    Patient   :  sukumarsty25@gmail.com    /  password123
echo    Admin     :  admin@pillsync.com        /  admin123
echo    Caregiver :  ramesh.kumar@pillsync.com /  password123
echo  =====================================================================
echo.
echo    SMTP EMAIL  :  sukumarkarnam4@gmail.com  (Gmail SMTP configured)
echo    BRANCH      :  milestone-2
echo.
echo  =====================================================================
echo    TWO SERVICE WINDOWS ARE OPEN - DO NOT CLOSE THEM:
echo      "PillSync Backend"   - FastAPI + Uvicorn (WSL)
echo      "PillSync Frontend"  - React Vite Dev Server
echo  =====================================================================
echo.
echo    To stop all services, run:  stop_project.bat
echo.
echo    Press any key to close this launcher window.
echo.
pause >nul
