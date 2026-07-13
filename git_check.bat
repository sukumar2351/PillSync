@echo off
REM Use Windows virtual environment python to run the script
if exist "%~dp0backend\venv\Scripts\python.exe" (
    "%~dp0backend\venv\Scripts\python.exe" "%~dp0git_check.py"
) else (
    python "%~dp0git_check.py"
)
