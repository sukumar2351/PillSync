@echo off
setlocal enabledelayedexpansion

REM Test script to isolate the parse error
set "PROJ=c:\Users\sukum\OneDrive\Desktop\PillSync"
set "HELPER=/mnt/c/Users/sukum/OneDrive/Desktop/PillSync/pillsync_helper.sh"

echo Testing CHECK 4 (venv check)...
wsl bash -c "bash !HELPER! check_venv" > "%TEMP%\ps_venv.txt" 2>&1
type "%TEMP%\ps_venv.txt"
echo.

echo Testing start backend line parse (not running it)...
echo HELPER is: !HELPER!
echo PROJ is: !PROJ!

echo Testing frontend dir...
set "FEDIR=!PROJ!\frontend"
echo FEDIR is: !FEDIR!

echo Done. All lines parsed OK.
pause > nul
