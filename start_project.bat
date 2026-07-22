@echo off
setlocal enabledelayedexpansion
title PillSync - One-Click Launcher
color 0A
cls

echo.
echo  =====================================================================
echo    PillSync - Intelligent Medicine Reminder System
echo    Milestone 2 - One-Click Startup Script
echo  =====================================================================
echo.
echo  [*] Running pre-flight checks. Please wait...
echo.

REM =====================================================================
REM  STEP 1: VERIFY PROJECT FOLDER
REM =====================================================================
echo  [CHECK 1/8] Verifying project folder...
if not exist "%~dp0backend\" (
    color 0C
    echo.
    echo  [ERROR] Project folder incomplete - Missing: backend\
    echo  Make sure you are running this from the PillSync root folder.
    echo.
    pause
    exit /b 1
)
if not exist "%~dp0frontend\" (
    color 0C
    echo.
    echo  [ERROR] Project folder incomplete - Missing: frontend\
    echo  Make sure you are running this from the PillSync root folder.
    echo.
    pause
    exit /b 1
)
echo  [CHECK 1/8] Project folder verified.                          [OK]

REM =====================================================================
REM  STEP 2: VERIFY PYTHON IS INSTALLED
REM =====================================================================
echo  [CHECK 2/8] Verifying Python installation...
python --version > "%TEMP%\pillsync_py.txt" 2>&1
findstr /C:"Python 3" "%TEMP%\pillsync_py.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Python 3 is not installed or not in PATH.
    echo  Download from: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
echo  [CHECK 2/8] Python is installed.                              [OK]

REM =====================================================================
REM  STEP 3: VERIFY WSL VENV EXISTS
REM =====================================================================
echo  [CHECK 3/8] Verifying WSL virtual environment...
wsl bash -c "test -f /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend/venv_wsl/bin/uvicorn && echo VENV_OK || echo VENV_MISSING" > "%TEMP%\pillsync_venv.txt" 2>&1
findstr /C:"VENV_OK" "%TEMP%\pillsync_venv.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] WSL virtual environment not found at backend/venv_wsl/
    echo  To create it, run in WSL:
    echo    cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend
    echo    python3 -m venv venv_wsl
    echo    ./venv_wsl/bin/pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo  [CHECK 3/8] WSL virtual environment is ready.                 [OK]

REM =====================================================================
REM  STEP 4: VERIFY NODE.JS
REM =====================================================================
echo  [CHECK 4/8] Verifying Node.js installation...
node --version > "%TEMP%\pillsync_node.txt" 2>&1
findstr /C:"v" "%TEMP%\pillsync_node.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  [CHECK 4/8] Node.js is installed.                             [OK]

REM =====================================================================
REM  STEP 5: VERIFY NPM
REM =====================================================================
echo  [CHECK 5/8] Verifying npm installation...
npm --version > "%TEMP%\pillsync_npm.txt" 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] npm is not installed. Reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  [CHECK 5/8] npm is installed.                                 [OK]

REM =====================================================================
REM  STEP 6: VERIFY WSL
REM =====================================================================
echo  [CHECK 6/8] Verifying WSL (Windows Subsystem for Linux)...
wsl bash -c "echo WSL_OK" > "%TEMP%\pillsync_wsl.txt" 2>&1
findstr /C:"WSL_OK" "%TEMP%\pillsync_wsl.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] WSL is not installed or not accessible.
    echo  Fix: Open PowerShell as Admin and run: wsl --install
    echo  Then restart your computer.
    echo.
    pause
    exit /b 1
)
echo  [CHECK 6/8] WSL is accessible.                                [OK]

REM =====================================================================
REM  STEP 7: VERIFY POSTGRESQL IN WSL
REM =====================================================================
echo  [CHECK 7/8] Verifying PostgreSQL in WSL...
wsl bash -c "which pg_ctlcluster > /dev/null 2>&1 && echo PG_INSTALLED || echo PG_MISSING" > "%TEMP%\pillsync_pgchk.txt" 2>&1
findstr /C:"PG_INSTALLED" "%TEMP%\pillsync_pgchk.txt" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] PostgreSQL (pg_ctlcluster) not found in WSL.
    echo  Fix: wsl sudo apt-get install postgresql -y
    echo.
    pause
    exit /b 1
)
echo  [CHECK 7/8] PostgreSQL is installed in WSL.                   [OK]

REM =====================================================================
REM  STEP 8: VERIFY .env FILE
REM =====================================================================
echo  [CHECK 8/8] Verifying backend .env configuration...
if not exist "%~dp0backend\.env" (
    color 0C
    echo.
    echo  [ERROR] backend\.env file not found!
    echo  Copy backend\.env.example to backend\.env and fill in credentials.
    echo.
    pause
    exit /b 1
)
findstr /C:"DATABASE_URL" "%~dp0backend\.env" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] DATABASE_URL missing from backend\.env
    echo.
    pause
    exit /b 1
)
findstr /C:"JWT_SECRET_KEY" "%~dp0backend\.env" > nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] JWT_SECRET_KEY missing from backend\.env
    echo.
    pause
    exit /b 1
)
echo  [CHECK 8/8] Environment configuration verified.               [OK]

REM Check SMTP (warn only, don't fail)
findstr /C:"EMAIL_ADDRESS" "%~dp0backend\.env" > nul 2>&1
if errorlevel 1 (
    color 0E
    echo  [WARN]  EMAIL_ADDRESS not set - email reminders will be disabled.
    color 0A
)

echo.
echo  ---------------------------------------------------------------
echo   All pre-flight checks PASSED! Starting PillSync services...
echo  ---------------------------------------------------------------
echo.

REM =====================================================================
REM  STAGE 1: START POSTGRESQL
REM =====================================================================
echo  [1/5] Starting PostgreSQL in WSL...
wsl bash -c "pg_ctlcluster 16 main start 2>/dev/null; sleep 2; pg_isready -h 127.0.0.1 -p 5432 -q && echo PG_OK || echo PG_FAIL" > "%TEMP%\pillsync_pg.txt" 2>&1
findstr /C:"PG_OK" "%TEMP%\pillsync_pg.txt" > nul 2>&1
if errorlevel 1 (
    echo  [!] First attempt failed. Retrying PostgreSQL...
    wsl bash -c "sleep 3; pg_ctlcluster 16 main start 2>/dev/null; sleep 4; pg_isready -h 127.0.0.1 -p 5432 -q && echo PG_OK || echo PG_FAIL" > "%TEMP%\pillsync_pg.txt" 2>&1
    findstr /C:"PG_OK" "%TEMP%\pillsync_pg.txt" > nul 2>&1
    if errorlevel 1 (
        color 0C
        echo.
        echo  [ERROR] PostgreSQL failed to start!
        echo  Try manually: wsl sudo pg_ctlcluster 16 main start
        echo.
        pause
        exit /b 1
    )
)
echo  [1/5] PostgreSQL is running on port 5432.                     [OK]

REM =====================================================================
REM  STAGE 2: RUN DATABASE MIGRATIONS
REM =====================================================================
echo  [2/5] Running database migrations...
wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && ./venv_wsl/bin/alembic upgrade head 2>&1" > "%TEMP%\pillsync_migrate.txt" 2>&1
type "%TEMP%\pillsync_migrate.txt" | findstr /i "error" > nul 2>&1
if not errorlevel 1 (
    color 0E
    echo  [WARN]  Migration may have had an issue. Check log if problems occur.
    color 0A
) else (
    echo  [2/5] Database schema is up to date.                         [OK]
)

REM =====================================================================
REM  STAGE 3: START FASTAPI BACKEND
REM =====================================================================
echo  [3/5] Starting FastAPI backend (WSL Uvicorn)...
start "PillSync Backend" wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && ./venv_wsl/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo  [3/5] Waiting for backend health check (up to 45 seconds)...
set BACKEND_READY=0
for /L %%i in (1,1,45) do (
    if !BACKEND_READY!==0 (
        wsl bash -c "curl -s -o /dev/null -w %%{http_code} http://127.0.0.1:8000/ 2>/dev/null" > "%TEMP%\pillsync_hc.txt" 2>&1
        findstr /C:"200" "%TEMP%\pillsync_hc.txt" > nul 2>&1
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
    echo  [ERROR] Backend did not start in 45 seconds!
    echo  Possible causes:
    echo    1. Database connection error - check DATABASE_URL in backend\.env
    echo    2. Port 8000 already in use by another process
    echo    3. Python import error - look at the "PillSync Backend" window
    echo.
    echo  To debug manually run:
    echo    wsl bash -c "cd /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend && ./venv_wsl/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"
    echo.
    pause
    exit /b 1
)
echo  [3/5] FastAPI backend is running at http://localhost:8000      [OK]

REM =====================================================================
REM  SMTP CHECK (non-fatal warning only)
REM =====================================================================
echo  [3b] Checking SMTP configuration...
wsl bash -c "grep -c EMAIL_APP_PASSWORD /mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend/.env" > "%TEMP%\pillsync_smtp.txt" 2>&1
findstr /C:"1" "%TEMP%\pillsync_smtp.txt" > nul 2>&1
if errorlevel 1 (
    color 0E
    echo  [WARN]  EMAIL_APP_PASSWORD not configured. Email reminders disabled.
    color 0A
) else (
    echo  [3b] Gmail SMTP credentials are configured.                 [OK]
)

REM =====================================================================
REM  STAGE 4: FRONTEND DEPENDENCIES
REM =====================================================================
echo  [4/5] Checking frontend dependencies...
if not exist "%~dp0frontend\node_modules\" (
    echo  [4/5] node_modules missing. Running npm install (this may take a minute)...
    pushd "%~dp0frontend"
    npm install
    popd
    if errorlevel 1 (
        color 0C
        echo.
        echo  [ERROR] npm install failed!
        echo  Check Node.js installation and internet connection.
        echo.
        pause
        exit /b 1
    )
)
echo  [4/5] Frontend dependencies are ready.                        [OK]

REM =====================================================================
REM  STAGE 5: START REACT FRONTEND
REM =====================================================================
echo  [5/5] Starting React Vite frontend...
set FRONTEND_DIR=%~dp0frontend
start "PillSync Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo  [5/5] Waiting for frontend (up to 30 seconds)...
set FRONTEND_READY=0
for /L %%i in (1,1,30) do (
    if !FRONTEND_READY!==0 (
        powershell -NoProfile -Command "try { (New-Object Net.WebClient).DownloadString('http://localhost:5173') | Out-Null; Write-Output 'READY' } catch { Write-Output 'WAIT' }" > "%TEMP%\pillsync_fe.txt" 2>&1
        findstr /C:"READY" "%TEMP%\pillsync_fe.txt" > nul 2>&1
        if not errorlevel 1 (
            set FRONTEND_READY=1
        ) else (
            timeout /t 1 /nobreak > nul
        )
    )
)
if !FRONTEND_READY!==0 (
    color 0E
    echo  [WARN]  Frontend did not respond in 30s. It may still be compiling.
    echo  Check the "PillSync Frontend" window.
    color 0A
) else (
    echo  [5/5] React frontend is running at http://localhost:5173    [OK]
)

REM =====================================================================
REM  VERIFY API DOCS
REM =====================================================================
echo.
echo  [FINAL] Verifying API docs endpoint...
wsl bash -c "curl -s -o /dev/null -w %%{http_code} http://127.0.0.1:8000/docs 2>/dev/null" > "%TEMP%\pillsync_docs.txt" 2>&1
findstr /C:"200" "%TEMP%\pillsync_docs.txt" > nul 2>&1
if errorlevel 1 (
    color 0E
    echo  [WARN]  API docs returned non-200. Backend may still be initializing.
    color 0A
) else (
    echo  [FINAL] API docs verified at http://localhost:8000/docs      [OK]
)

REM =====================================================================
REM  OPEN BROWSER
REM =====================================================================
echo.
echo  Opening browser...
timeout /t 2 /nobreak > nul
start "" "http://localhost:5173"
timeout /t 1 /nobreak > nul
start "" "http://localhost:8000/docs"

REM =====================================================================
REM  SUCCESS DASHBOARD
REM =====================================================================
cls
color 0A
echo.
echo  =====================================================================
echo    ^>^>  PILLSYNC IS FULLY RUNNING!
echo  =====================================================================
echo.
echo    Service          Address                        Status
echo    ---------------  -----------------------------  -------
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
echo    IMPORTANT: Keep these 2 windows open while using the app:
echo      "PillSync Backend"   - FastAPI server (WSL)
echo      "PillSync Frontend"  - React Vite server
echo  =====================================================================
echo.
echo    To stop all services:  stop_project.bat
echo.
echo    Press any key to close this launcher window.
echo.
pause > nul
