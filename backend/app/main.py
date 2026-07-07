from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base, SessionLocal
from app.models.user_models import Role, User
from app.utils.security import get_password_hash
from app.routers import auth_router, users_router, admin_router

def seed_sample_data(db):
    from app.models.user_models import User, Role, PatientProfile, CaregiverProfile
    from app.utils.security import get_password_hash
    from datetime import datetime, timedelta
    import random

    patient_role = db.query(Role).filter(Role.name == "patient").first()
    caregiver_role = db.query(Role).filter(Role.name == "caregiver").first()
    
    if not patient_role or not caregiver_role:
        return

    # Check if we already have seeded data
    existing_patients = db.query(User).filter(User.role_id == patient_role.id).count()
    if existing_patients > 0:
        return

    print("Seeding sample caregivers...")
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
        db.flush() # get user.id
        
        # Determine gender
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

    print("Seeding sample patients...")
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
    print("Database seeding completed successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Automatically create tables if they do not exist
    from app.config import settings
    print("DEBUG: Loaded DATABASE_URL is:", settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed default roles and admin account
    db = SessionLocal()
    try:
        # Seed Roles
        roles_to_seed = ["admin", "patient", "caregiver"]
        for idx, rname in enumerate(roles_to_seed, 1):
            role_exists = db.query(Role).filter(Role.name == rname).first()
            if not role_exists:
                role_obj = Role(id=idx, name=rname)
                db.add(role_obj)
        db.commit()

        # Seed Admin Account if it doesn't exist
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

        # Seed sample patient and caregiver data
        seed_sample_data(db)

    except Exception as e:
        db.rollback()
        print(f"Database seeding failed: {e}")
    finally:
        db.close()
        
    yield

# Create FastAPI app with lifespan handler
app = FastAPI(
    title="PillSync API",
    description="Intelligent Medicine Reminder and Medication Tracking Platform - Milestone 1 API Service",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# React runs on http://localhost:5173 by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "project": "PillSync",
        "milestone": 1,
        "status": "online",
        "documentation": "/docs"
    }
