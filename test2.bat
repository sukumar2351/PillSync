@echo off
setlocal enabledelayedexpansion
set "HELPER=/mnt/c/Users/sukum/OneDrive/Desktop/PillSync/pillsync_helper.sh"
echo [CHECK 4] Verifying WSL venv...
wsl bash !HELPER! check_venv > "%TEMP%\ps_venv.txt" 2>&1
findstr /C:"VENV_OK" "%TEMP%\ps_venv.txt" > nul 2>&1
if errorlevel 1 (
    echo VENV MISSING
) else (
    echo VENV OK
)
pause > nul
