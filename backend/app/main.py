import logging
import logging.config
import time
import traceback
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import engine, Base, SessionLocal
from app.models.user_models import Role, User, NotificationSetting
from app.utils.security import get_password_hash
from app.routers import auth_router, users_router, admin_router, medicines_router, notifications_router



# ============================================================
# LOGGING CONFIGURATION
# Must be called before any other module uses logging.
# ============================================================
def configure_logging():
    """
    Configure structured logging for the entire application.
    Sets up a single StreamHandler (stdout) with timestamps for:
      - Root logger (INFO)
      - uvicorn / uvicorn.access / uvicorn.error
      - sqlalchemy.engine (WARNING — change to INFO to see SQL queries)
      - sms_service (DEBUG — all SMS activity)
      - pillsync (our application namespace)
    """
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "format": "[%(asctime)s] ACCESS   %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "stream": "ext://sys.stdout",
                "level": "DEBUG",
            },
            "access_console": {
                "class": "logging.StreamHandler",
                "formatter": "access",
                "stream": "ext://sys.stdout",
                "level": "INFO",
            },
        },
        "root": {
            "level": "INFO",
            "handlers": ["console"],
        },
        "loggers": {
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["access_console"],
                "propagate": False,
            },
            # Show SQL queries at WARNING to avoid noise.
            # Change to "INFO" here to see every SQL statement.
            "sqlalchemy.engine": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False,
            },
            # Full debug for our SMS service
            "sms_service": {
                "level": "DEBUG",
                "handlers": ["console"],
                "propagate": False,
            },
            # Our general app logger
            "pillsync": {
                "level": "DEBUG",
                "handlers": ["console"],
                "propagate": False,
            },
        },
    }
    logging.config.dictConfig(log_config)

# Apply logging config FIRST, before any imports that call logging
configure_logging()

app_logger = logging.getLogger("pillsync")


# ============================================================
# SAMPLE DATA SEEDING
# ============================================================
def seed_sample_data(db):
    from app.models.user_models import User, Role, PatientProfile, CaregiverProfile
    from app.utils.security import get_password_hash
    from datetime import datetime, timedelta
    import random

    patient_role = db.query(Role).filter(Role.name == "patient").first()
    caregiver_role = db.query(Role).filter(Role.name == "caregiver").first()

    if not patient_role or not caregiver_role:
        return

    existing_patients = db.query(User).filter(User.role_id == patient_role.id).count()
    if existing_patients > 0:
        return

    app_logger.info("Seeding sample caregivers...")
    caregiver_names = [
        "Ramesh Kumar", "Sunitha Devi", "Mahesh Rao", "Kavitha Sharma", "Rajesh Patel",
        "Srinivas Reddy", "Anil Kumar", "Sujatha Devi", "Manoj Verma", "Swapna Reddy"
    ]

    caregivers = []
    hashed_pwd = get_password_hash("password123")

    for idx, name in enumerate(caregiver_names):
        first, last = name.split(" ")
        email = f"{first.lower()}.{last.lower()}@pillsync.com"

        user = User(
            email=email,
            hashed_password=hashed_pwd,
            role_id=caregiver_role.id,
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
        )
        db.add(user)
        db.flush()

        if name in ["Sunitha Devi", "Kavitha Sharma", "Sujatha Devi", "Swapna Reddy"]:
            gender = "Female"
        else:
            gender = "Male"

        profile = CaregiverProfile(
            user_id=user.id,
            full_name=name,
            phone=f"+91 98765 432{idx:02d}",
            age=random.randint(30, 55),
            gender=gender,
            address=f"Flat {101+idx}, Sai Residency, Road No {idx+1}, Hyderabad, Telangana"
        )
        db.add(profile)
        caregivers.append(user)

    app_logger.info("Seeding sample patients...")
    patient_data = [
        ("Rahul Sharma", "Male", 28, "O+", "+91 99887 76601", "Ramesh Kumar"),
        ("Priya Reddy", "Female", 34, "A+", "+91 99887 76602", "Sunitha Devi"),
        ("Arjun Kumar", "Male", 45, "B+", "+91 99887 76603", "Mahesh Rao"),
        ("Sneha Patel", "Female", 22, "AB+", "+91 99887 76604", "Kavitha Sharma"),
        ("Ravi Teja", "Male", 31, "O-", "+91 99887 76605", "Rajesh Patel"),
        ("Ananya Rao", "Female", 29, "A-", "+91 99887 76606", "Srinivas Reddy"),
        ("Vikram Singh", "Male", 52, "B-", "+91 99887 76607", "Anil Kumar"),
        ("Kiran Kumar", "Male", 38, "AB-", "+91 99887 76608", "Sujatha Devi"),
        ("Pooja Sharma", "Female", 26, "O+", "+91 99887 76609", "Manoj Verma"),
        ("Sai Krishna", "Male", 41, "A+", "+91 99887 76610", "Swapna Reddy"),
        ("Nikhil Verma", "Male", 33, "B+", "+91 99887 76611", "Ramesh Kumar"),
        ("Lakshmi Devi", "Female", 67, "O+", "+91 99887 76612", "Sunitha Devi"),
        ("Harsha Vardhan", "Male", 58, "AB+", "+91 99887 76613", "Mahesh Rao"),
        ("Deepika Rani", "Female", 48, "A+", "+91 99887 76614", "Kavitha Sharma"),
        ("Suresh Babu", "Male", 72, "B+", "+91 99887 76615", "Rajesh Patel"),
        ("Meghana Reddy", "Female", 24, "O-", "+91 99887 76616", "Srinivas Reddy"),
        ("Akash Jain", "Male", 30, "A-", "+91 99887 76617", "Anil Kumar"),
        ("Bhavya Nair", "Female", 27, "B-", "+91 99887 76618", "Sujatha Devi"),
        ("Ajay Kumar", "Male", 35, "AB-", "+91 99887 76619", "Manoj Verma"),
        ("Divya Sri", "Female", 25, "O+", "+91 99887 76620", "Swapna Reddy")
    ]

    for idx, (name, gender, age, blood, phone, caregiver_name) in enumerate(patient_data):
        first, last = name.split(" ")
        email = f"{first.lower()}.{last.lower()}@pillsync.com"

        user = User(
            email=email,
            hashed_password=hashed_pwd,
            role_id=patient_role.id,
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
        )
        db.add(user)
        db.flush()

        profile = PatientProfile(
            user_id=user.id,
            full_name=name,
            phone=phone,
            age=age,
            gender=gender,
            blood_group=blood,
            address=f"Plot {idx+20}, Sector {idx%4 + 1}, Jubilee Hills, Hyderabad, Telangana",
            emergency_contact=f"{caregiver_name} (Caregiver: +91 98765 43200)"
        )
        db.add(profile)

    db.commit()
    app_logger.info("Database seeding completed successfully.")


# ============================================================
# APPLICATION LIFESPAN
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    app_logger.info("=" * 60)
    app_logger.info(" PillSync API Server — STARTING UP")
    app_logger.info(" Version: 2.0.0  |  Environment: Milestone 2")
    app_logger.info("=" * 60)

    from app.config import settings
    app_logger.info(f"Database URL: {settings.DATABASE_URL}")

    # 1. Create all tables
    Base.metadata.create_all(bind=engine)
    app_logger.info("Database tables verified / created.")

    # 2. Run dynamic schema migrations
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE;"))
        db.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS notification_preference VARCHAR(50) DEFAULT 'browser';"))
        db.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS reminder_status VARCHAR(50);"))
        db.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50);"))
        # New SMS audit columns on notification_settings
        db.execute(text("ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS sms_message_sid VARCHAR(50);"))
        db.execute(text("ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS sms_error TEXT;"))
        db.execute(text("ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS sms_recipient VARCHAR(20);"))
        db.commit()
        app_logger.info("Schema migrations applied successfully.")
    except Exception as migration_err:
        db.rollback()
        app_logger.warning(f"Schema migration skipped or already applied: {migration_err}")
    finally:
        db.close()

    # 3. Seed roles + admin + sample data
    db = SessionLocal()
    try:
        roles_to_seed = ["admin", "patient", "caregiver"]
        for idx, rname in enumerate(roles_to_seed, 1):
            role_exists = db.query(Role).filter(Role.name == rname).first()
            if not role_exists:
                role_obj = Role(id=idx, name=rname)
                db.add(role_obj)
        db.commit()

        admin_email = "admin@pillsync.com"
        admin_exists = db.query(User).filter(User.email == admin_email).first()
        if not admin_exists:
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if admin_role:
                hashed_pwd = get_password_hash("admin123")
                admin_user = User(
                    email=admin_email,
                    hashed_password=hashed_pwd,
                    role_id=admin_role.id,
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
                app_logger.info("Admin account seeded.")

        seed_sample_data(db)

    except Exception as e:
        db.rollback()
        app_logger.error(f"Database seeding failed: {e}")
        app_logger.error(traceback.format_exc())
    finally:
        db.close()

    app_logger.info("=" * 60)
    app_logger.info(" PillSync API is READY — Listening for requests...")
    app_logger.info(" Docs: http://127.0.0.1:8000/docs")
    app_logger.info("=" * 60)

    yield

    app_logger.info("PillSync API Server — SHUTTING DOWN")


# ============================================================
# CREATE FASTAPI APP
# ============================================================
app = FastAPI(
    title="PillSync API",
    description="Intelligent Medicine Reminder and Medication Tracking Platform — Milestone 2",
    version="2.0.0",
    lifespan=lifespan
)

# ============================================================
# CORS MIDDLEWARE
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST LOGGING MIDDLEWARE
# Logs every incoming request with: method, path, authenticated
# user email (from JWT), response status, and processing time.
# ============================================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()

    # Attempt to extract email from Bearer JWT without blocking the request
    user_email = "anonymous"
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from jose import jwt as jose_jwt
            from app.config import settings
            token = auth_header.split(" ", 1)[1]
            payload = jose_jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False}   # we only need the subject
            )
            user_email = payload.get("sub", "unknown")
        except Exception:
            user_email = "invalid_token"

    app_logger.info(f"→ {request.method} {request.url.path} | user={user_email}")

    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        app_logger.info(
            f"← {request.method} {request.url.path} | status={response.status_code} | "
            f"user={user_email} | {elapsed_ms:.1f}ms"
        )
        return response

    except Exception as exc:
        elapsed_ms = (time.perf_counter() - start) * 1000
        app_logger.error(
            f"✗ {request.method} {request.url.path} | UNHANDLED EXCEPTION | "
            f"user={user_email} | {elapsed_ms:.1f}ms"
        )
        app_logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(exc)}"}
        )


# ============================================================
# GLOBAL EXCEPTION HANDLER (catches HTTPException-unhandled errors)
# ============================================================
from fastapi.exceptions import RequestValidationError
from fastapi import status as http_status

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    app_logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    app_logger.error(f"Uncaught exception on {request.method} {request.url.path}: {exc}")
    app_logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unexpected server error: {str(exc)}"}
    )


# ============================================================
# ROUTERS
# ============================================================
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(medicines_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")



@app.get("/")
def read_root():
    return {
        "project": "PillSync",
        "milestone": 2,
        "status": "online",
        "documentation": "/docs"
    }
