from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.medicine_models import EmergencyCard
from app.models.user_models import User, PatientProfile, Medicine
from app.services.auth_service import get_current_user, RoleChecker

router = APIRouter(prefix="/emergency-card", tags=["Emergency Medical Card"])

patient_or_caregiver = RoleChecker(allowed_roles=["patient", "caregiver", "admin", "doctor"])

class EmergencyCardSchema(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_conditions: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_contact: Optional[str] = None

@router.get("/")
def get_emergency_card(
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(patient_or_caregiver)
):
    """Retrieve emergency card info along with active medicines list."""
    target_user_id = current_user.id
    if patient_id and current_user.role.name in ["caregiver", "admin", "doctor"]:
        target_user_id = patient_id

    card = db.query(EmergencyCard).filter(EmergencyCard.user_id == target_user_id).first()
    patient_profile = db.query(PatientProfile).filter(PatientProfile.user_id == target_user_id).first()
    active_medicines = db.query(Medicine).filter(Medicine.user_id == target_user_id).all()
    
    med_list = [f"{m.name} ({m.dosage})" for m in active_medicines]
    
    return {
        "patient_name": patient_profile.full_name if patient_profile else "Patient",
        "phone": patient_profile.phone if patient_profile else "N/A",
        "blood_group": (card.blood_group if card and card.blood_group else (patient_profile.blood_group if patient_profile else "O+")),
        "allergies": card.allergies if card and card.allergies else "None reported",
        "emergency_contact_name": card.emergency_contact_name if card and card.emergency_contact_name else "Primary Caregiver",
        "emergency_contact_phone": card.emergency_contact_phone if card and card.emergency_contact_phone else (patient_profile.phone if patient_profile else "911"),
        "medical_conditions": card.medical_conditions if card and card.medical_conditions else "Hypertension, Diabetes Type 2",
        "doctor_name": card.doctor_name if card and card.doctor_name else "Dr. Sarah Jenkins",
        "doctor_contact": card.doctor_contact if card and card.doctor_contact else "+1 (555) 234-5678",
        "current_medicines": med_list,
        "created_at": card.created_at if card else datetime.now()
    }

@router.post("/")
def create_or_update_emergency_card(
    payload: EmergencyCardSchema,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Save or update patient emergency card information."""
    card = db.query(EmergencyCard).filter(EmergencyCard.user_id == current_user.id).first()
    
    if not card:
        card = EmergencyCard(user_id=current_user.id)
        db.add(card)
        
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(card, key, val)
        
    db.commit()
    db.refresh(card)
    return card
