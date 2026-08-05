@echo off
:: ============================================================
:: PillSync Backend Startup Script
:: Run this from the project root: PillSync\
:: ============================================================

echo ============================================================
echo  Starting PillSync Backend
echo ============================================================

:: Step 1: Start PostgreSQL service if not running
echo [1] Checking PostgreSQL service...
sc query postgresql-x64-18 | findstr "RUNNING" >nul 2>&1
if errorlevel 1 (
    echo     Starting PostgreSQL 18 service...
    net start postgresql-x64-18
) else (
    echo     PostgreSQL is already running.
)

:: Wait for PostgreSQL to be ready
timeout /t 3 /nobreak >nul

:: Step 2: Activate venv and start uvicorn
echo [2] Starting FastAPI with venv...
cd backend
call venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
