from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.schemas.user_schemas import PatientRegister, CaregiverRegister, UserLogin, Token, UserResponse
from app.services.auth_service import register_patient, register_caregiver, authenticate_user, get_current_user
from app.utils.security import create_access_token
from app.models.user_models import User
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register/patient", status_code=status.HTTP_201_CREATED)
def register_as_patient(schema: PatientRegister, db: Session = Depends(get_db)):
    """Register a new patient and create their empty profile."""
    user = register_patient(db, schema)
    return {"message": "Registration successful", "user_id": user.id}


@router.post("/register/caregiver", status_code=status.HTTP_201_CREATED)
def register_as_caregiver(schema: CaregiverRegister, db: Session = Depends(get_db)):
    """Register a new caregiver and create their empty profile."""
    user = register_caregiver(db, schema)
    return {"message": "Registration successful", "user_id": user.id}


@router.post("/login", response_model=Token)
def login(schema: UserLogin, db: Session = Depends(get_db)):
    """Authenticate credentials and generate a JWT access token."""
    user = authenticate_user(db, schema.email, schema.password)
    
    # Generate token
    token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.name, "uid": user.id},
        expires_delta=token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.name,
        "email": user.email
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_details(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve full details of the currently logged-in user and their profile."""
    from app.services.user_service import get_user_profile
    profile = get_user_profile(db, current_user)
    
    # Return UserResponse schema
    role_name = current_user.role.name
    
    # Structure profile response based on role type
    profile_data = None
    if profile:
        if role_name == "patient":
            profile_data = {
                "id": profile.id,
                "full_name": profile.full_name,
                "phone": profile.phone,
                "age": profile.age,
                "gender": profile.gender,
                "blood_group": profile.blood_group,
                "address": profile.address,
                "emergency_contact": profile.emergency_contact,
                "account_status": profile.account_status
            }
        elif role_name == "caregiver":
            profile_data = {
                "id": profile.id,
                "full_name": profile.full_name,
                "phone": profile.phone,
                "age": profile.age,
                "gender": profile.gender,
                "address": profile.address,
                "account_status": profile.account_status,
                "emergency_contact": profile.emergency_contact,
                "emergency_phone": profile.emergency_phone,
                "profile_photo": profile.profile_photo
            }
            
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": role_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "profile": profile_data
    }
