@echo off
title PillSync - Stopping...
color 0C
cls

echo.
echo  ===================================================
echo   PILLSYNC - Stopping All Services
echo  ===================================================
echo.

REM -------------------------------------------------------
REM Stop FastAPI Backend (inside WSL)
REM -------------------------------------------------------
echo  [1/3] Stopping FastAPI Backend...
wsl bash -c "if [ -f /tmp/pillsync_backend.pid ]; then kill \$(cat /tmp/pillsync_backend.pid) 2>/dev/null; rm -f /tmp/pillsync_backend.pid; fi; pkill -f 'uvicorn app.main:app' 2>/dev/null; echo DONE" >nul 2>&1
echo  [1/3] Backend stopped. OK

REM -------------------------------------------------------
REM Stop React Frontend (node process on port 5173)
REM -------------------------------------------------------
echo  [2/3] Stopping React Frontend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
taskkill /F /IM node.exe /T >nul 2>&1
echo  [2/3] Frontend stopped. OK

REM -------------------------------------------------------
REM Stop PostgreSQL (optional - leave running for safety)
REM -------------------------------------------------------
echo  [3/3] PostgreSQL left running (it is safe to keep it running).
echo        To stop PostgreSQL manually: wsl pg_ctlcluster 16 main stop

echo.
color 0A
echo  ===================================================
echo   PILLSYNC STOPPED SUCCESSFULLY.
echo  ===================================================
echo.
echo   All PillSync services have been stopped.
echo   You can restart the project by running start_project.bat
echo.
timeout /t 4 /nobreak >nul
