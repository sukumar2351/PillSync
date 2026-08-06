import sys, os, subprocess, pathlib
sys.path.insert(0, os.getcwd())

print("=" * 60)
print("PILLSYNC STARTUP DIAGNOSTIC")
print("=" * 60)

# ── 1. .env loading ──────────────────────────────────────────────
print("\n[1] .env / Config Loading")
try:
    from app.config import settings
    print(f"  DATABASE_URL : {settings.DATABASE_URL}")
    print(f"  ENVIRONMENT  : {settings.ENVIRONMENT}")
    print("  Status       : OK")
except Exception as e:
    print(f"  FAILED: {e}")

# ── 2. psycopg2 ──────────────────────────────────────────────────
print("\n[2] psycopg2 Installation")
try:
    import psycopg2
    print(f"  psycopg2 version : {psycopg2.__version__}")
    print("  Status           : OK")
except ImportError as e:
    print(f"  MISSING : {e}")

# ── 3. SQLAlchemy engine ─────────────────────────────────────────
print("\n[3] SQLAlchemy Engine")
try:
    from app.database import engine, Base, SessionLocal
    print(f"  Engine dialect : {engine.dialect.name}")
    print("  Status         : OK")
except Exception as e:
    print(f"  FAILED: {e}")

# ── 4. PostgreSQL connection ─────────────────────────────────────
print("\n[4] PostgreSQL Direct Connection")
try:
    from urllib.parse import urlparse
    url = settings.DATABASE_URL
    r = urlparse(url)
    host = r.hostname
    port = r.port or 5432
    user = r.username
    password = r.password
    dbname = r.path.lstrip("/")
    print(f"  Host     : {host}")
    print(f"  Port     : {port}")
    print(f"  User     : {user}")
    print(f"  Database : {dbname}")
    conn = psycopg2.connect(
        host=host, port=port, user=user,
        password=password, dbname=dbname, connect_timeout=5
    )
    print("  Connection : SUCCESS")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(f"  PG Version : {cur.fetchone()[0][:60]}")
    conn.close()
except Exception as e:
    print(f"  Connection FAILED: {e}")

# ── 5. Port 5432 listening ───────────────────────────────────────
print("\n[5] Port 5432 Status")
result = subprocess.run(["netstat", "-an"], capture_output=True, text=True)
port_lines = [l for l in result.stdout.splitlines() if ":5432" in l]
if port_lines:
    for l in port_lines:
        print(f"  {l.strip()}")
else:
    print("  Port 5432 is NOT listening — PostgreSQL is NOT running")

# ── 6. PostgreSQL Windows service ────────────────────────────────
print("\n[6] PostgreSQL Windows Service")
result2 = subprocess.run(
    ["sc", "query", "state=", "all"],
    capture_output=True, text=True
)
pg_services = []
current = {}
for line in result2.stdout.splitlines():
    line = line.strip()
    if line.startswith("SERVICE_NAME:"):
        current = {"name": line.split(":", 1)[1].strip()}
    elif line.startswith("STATE") and current:
        current["state"] = line
        if "postgres" in current.get("name", "").lower():
            pg_services.append(current)
        current = {}

if pg_services:
    for svc in pg_services:
        print(f"  Service: {svc['name']}  |  {svc.get('state','')}")
else:
    print("  No PostgreSQL service found")

# ── 7. Google Gemini SDK ─────────────────────────────────────────
print("\n[7] Google Gemini SDK")
try:
    import google.genai
    print("  google-genai        : installed")
except ImportError:
    print("  google-generativeai : NOT installed")
try:
    import google.genai
    print("  google-genai        : installed")
except ImportError:
    print("  google-genai        : NOT installed")

# ── 8. APScheduler ───────────────────────────────────────────────
print("\n[8] APScheduler")
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    print("  APScheduler : installed")
except ImportError as e:
    print(f"  MISSING: {e}")

# ── 9. Missing service files ─────────────────────────────────────
print("\n[9] Service Files")
services = [
    "app/services/refill_service.py",
    "app/services/dosage_analysis_service.py",
    "app/services/notification_service.py",
    "app/services/adherence_service.py",
]
for svc in services:
    exists = pathlib.Path(svc).exists()
    status = "OK" if exists else "MISSING"
    print(f"  {status:8s} {svc}")

# ── 10. SQLAlchemy models importable? ────────────────────────────
print("\n[10] Model Imports")
try:
    from app.models.user_models import User, Role
    print("  user_models            : OK")
except Exception as e:
    print(f"  user_models FAILED     : {e}")
try:
    from app.models.refill_models import RefillPrediction
    print("  refill_models          : OK")
except Exception as e:
    print(f"  refill_models FAILED   : {e}")
try:
    from app.models.dosage_analysis_models import DosageAnalysisResult
    print("  dosage_analysis_models : OK")
except Exception as e:
    print(f"  dosage_analysis_models FAILED: {e}")

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
