#!/bin/bash
# PillSync helper script for Windows batch file integration
# This script is called by start_project.bat to avoid CMD shell escaping issues

BACKEND_WSL="/mnt/c/Users/sukum/OneDrive/Desktop/PillSync/backend"

case "$1" in
  check_venv)
    if [ -f "$BACKEND_WSL/venv_wsl/bin/uvicorn" ]; then
      echo "VENV_OK"
    else
      echo "VENV_MISSING"
    fi
    ;;
  create_venv)
    cd "$BACKEND_WSL" || exit 1
    python3 -m venv venv_wsl
    ./venv_wsl/bin/pip install --upgrade pip -q
    ./venv_wsl/bin/pip install -r requirements.txt -q
    echo "INSTALL_OK"
    ;;
  check_pg)
    if which pg_ctlcluster > /dev/null 2>&1; then
      echo "PG_INSTALLED"
    else
      echo "PG_MISSING"
    fi
    ;;
  start_pg)
    pg_ctlcluster 16 main start 2>/dev/null
    sleep 3
    if pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
      echo "PG_OK"
    else
      echo "PG_FAIL"
    fi
    ;;
  retry_pg)
    sleep 3
    pg_ctlcluster 16 main start 2>/dev/null
    sleep 5
    if pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
      echo "PG_OK"
    else
      echo "PG_FAIL"
    fi
    ;;
  run_migrations)
    cd "$BACKEND_WSL" || exit 1
    ./venv_wsl/bin/alembic upgrade head 2>&1
    ;;
  start_backend)
    cd "$BACKEND_WSL" || exit 1
    exec ./venv_wsl/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ;;
  check_smtp)
    if grep -q "EMAIL_APP_PASSWORD" "$BACKEND_WSL/.env" 2>/dev/null; then
      echo "SMTP_OK"
    else
      echo "SMTP_MISSING"
    fi
    ;;
  diag_pg)
    pg_isready -h 127.0.0.1 -p 5432 2>&1
    ;;
  diag_import)
    cd "$BACKEND_WSL" || exit 1
    ./venv_wsl/bin/python3 -c "import app.main; print('Import OK')" 2>&1
    ;;
  *)
    echo "Unknown command: $1"
    exit 1
    ;;
esac
