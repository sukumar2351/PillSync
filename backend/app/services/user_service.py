from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Dict, Any, List

from app.models.user_models import User, Role, PatientProfile, CaregiverProfile
from app.schemas.user_schemas import PatientProfileUpdate, CaregiverProfileUpdate

def get_user_profile(db: Session, user: User) -> Any:
    """Return user's profile based on their role."""
    if user.role.name == "patient":
        return db.query(PatientProfile).filter(PatientProfile.user_id == user.id).first()
    elif user.role.name == "caregiver":
        return db.query(CaregiverProfile).filter(CaregiverProfile.user_id == user.id).first()
    return None


def update_patient_profile(db: Session, user: User, data: PatientProfileUpdate) -> PatientProfile:
    """Update patient profile details."""
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == user.id).first()
    if not profile:
        profile = PatientProfile(user_id=user.id, full_name=data.full_name)
        db.add(profile)
        db.flush()

    profile.full_name = data.full_name
    profile.phone = data.phone
    profile.age = data.age
    profile.gender = data.gender
    profile.blood_group = data.blood_group
    profile.address = data.address
    profile.emergency_contact = data.emergency_contact

    db.commit()
    db.refresh(profile)
    return profile


def update_caregiver_profile(db: Session, user: User, data: CaregiverProfileUpdate) -> CaregiverProfile:
    """Update caregiver profile details."""
    profile = db.query(CaregiverProfile).filter(CaregiverProfile.user_id == user.id).first()
    if not profile:
        profile = CaregiverProfile(user_id=user.id, full_name=data.full_name)
        db.add(profile)
        db.flush()

    if data.email and data.email != user.email:
        existing_user = db.query(User).filter(User.email == data.email).first()
        if existing_user and existing_user.id != user.id:
            raise ValueError("Email address is already in use by another account.")
        user.email = data.email

    profile.full_name = data.full_name
    profile.phone = data.phone
    profile.age = data.age
    profile.gender = data.gender
    profile.address = data.address
    profile.emergency_contact = data.emergency_contact
    profile.emergency_phone = data.emergency_phone
    profile.profile_photo = data.profile_photo

    db.commit()
    db.refresh(profile)
    return profile


def get_admin_dashboard_stats(db: Session) -> Dict[str, Any]:
    """Retrieve statistical counters and recent user registrations for the admin panel."""
    from datetime import datetime, date, time
    
    # Count metrics
    total_users = db.query(func_count(User.id)).scalar() or 0
    
    patient_role = db.query(Role).filter(Role.name == "patient").first()
    total_patients = db.query(func_count(User.id)).filter(User.role_id == patient_role.id).scalar() if patient_role else 0
    
    caregiver_role = db.query(Role).filter(Role.name == "caregiver").first()
    total_caregivers = db.query(func_count(User.id)).filter(User.role_id == caregiver_role.id).scalar() if caregiver_role else 0

    # Today's registrations (since midnight)
    today_start = datetime.combine(date.today(), time.min)
    todays_registrations = db.query(func_count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    
    # Active / Inactive accounts
    active_users = db.query(func_count(User.id)).filter(User.is_active == True).scalar() or 0
    inactive_users = db.query(func_count(User.id)).filter(User.is_active == False).scalar() or 0

    # Recent users
    latest_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_caregivers": total_caregivers,
        "todays_registrations": todays_registrations,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "latest_users": [
            {
                "id": u.id,
                "email": u.email,
                "role": u.role.name,
                "created_at": u.created_at
            }
            for u in latest_users
        ]
    }


def get_all_users_list(db: Session) -> List[Dict[str, Any]]:
    """Return all registered users in the system."""
    users = db.query(User).order_by(User.id.asc()).all()
    result = []
    for u in users:
        profile_name = ""
        if u.role.name == "patient" and u.patient_profile:
            profile_name = u.patient_profile.full_name
        elif u.role.name == "caregiver" and u.caregiver_profile:
            profile_name = u.caregiver_profile.full_name
        elif u.role.name == "admin":
            profile_name = "Administrator"

        result.append({
            "id": u.id,
            "email": u.email,
            "role": u.role.name,
            "full_name": profile_name,
            "is_active": u.is_active,
            "created_at": u.created_at
        })
    return result


# Helper function to perform SQL COUNT using sqlalchemy.func
def func_count(field):
    from sqlalchemy import func
    return func.count(field)


def get_all_patients_list(db: Session) -> List[Dict[str, Any]]:
    """Return all registered patients in the system."""
    from app.models.user_models import User, Role, PatientProfile
    patient_role = db.query(Role).filter(Role.name == "patient").first()
    if not patient_role:
        return []
    patients = db.query(User).filter(User.role_id == patient_role.id).all()
    result = []
    for u in patients:
        profile = u.patient_profile
        result.append({
            "id": u.id,
            "email": u.email,
            "role": "patient",
            "full_name": profile.full_name if profile else "",
            "phone": profile.phone if profile else "",
            "age": profile.age if profile else None,
            "gender": profile.gender if profile else "",
            "blood_group": profile.blood_group if profile else "",
            "address": profile.address if profile else "",
            "emergency_contact": profile.emergency_contact if profile else "",
            "is_active": u.is_active,
            "created_at": u.created_at
        })
    return result


def get_all_caregivers_list(db: Session) -> List[Dict[str, Any]]:
    """Return all registered caregivers in the system."""
    from app.models.user_models import User, Role, CaregiverProfile
    caregiver_role = db.query(Role).filter(Role.name == "caregiver").first()
    if not caregiver_role:
        return []
    caregivers = db.query(User).filter(User.role_id == caregiver_role.id).all()
    result = []
    for u in caregivers:
        profile = u.caregiver_profile
        result.append({
            "id": u.id,
            "email": u.email,
            "role": "caregiver",
            "full_name": profile.full_name if profile else "",
            "phone": profile.phone if profile else "",
            "age": profile.age if profile else None,
            "gender": profile.gender if profile else "",
            "address": profile.address if profile else "",
            "is_active": u.is_active,
            "created_at": u.created_at
        })
    return result
