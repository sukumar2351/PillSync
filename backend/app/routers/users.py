from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app.models.user_models import User
from app.services.auth_service import get_current_user
from app.services.user_service import get_user_profile, update_patient_profile, update_caregiver_profile
from app.schemas.user_schemas import PatientProfileUpdate, CaregiverProfileUpdate, PatientProfileResponse, CaregiverProfileResponse

router = APIRouter(prefix="/users", tags=["Users & Profiles"])


@router.get("/profile")
def read_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve the profile data of the currently authenticated user."""
    profile = get_user_profile(db, current_user)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile


@router.put("/profile")
def modify_profile(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update profile data. Validates details conditionally using Patient or Caregiver rules."""
    role_name = current_user.role.name
    
    try:
        if role_name == "patient":
            # Validates using Patient constraints (e.g. blood group, emergency contact)
            validated = PatientProfileUpdate(**payload)
            update_patient_profile(db, current_user, validated)
        elif role_name == "caregiver":
            # Validates using Caregiver constraints
            validated = CaregiverProfileUpdate(**payload)
            update_caregiver_profile(db, current_user, validated)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators do not have a patient or caregiver profile to update."
            )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )

    return {"message": "Profile updated successfully"}
