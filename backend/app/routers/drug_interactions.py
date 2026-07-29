from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.medicine_models import DrugInteraction
from app.models.user_models import User, Medicine
from app.services.auth_service import get_current_user, RoleChecker
from pydantic import BaseModel

router = APIRouter(prefix="/drug-interactions", tags=["Drug Interactions"])

patient_only = RoleChecker(allowed_roles=["patient"])

class InteractionCheckRequest(BaseModel):
    medicine_name: str

class InteractionResponse(BaseModel):
    medicine_a: str
    medicine_b: str
    severity: str
    description: str

@router.post("/check", response_model=List[InteractionResponse])
def check_drug_interactions(
    payload: InteractionCheckRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(patient_only)
):
    """
    Check if the proposed medicine has any clinical interactions with the
    patient's currently active medications.
    """
    proposed_med = payload.medicine_name.strip()
    if not proposed_med:
        return []
        
    # Get user's current active medicines
    active_meds = db.query(Medicine).filter(Medicine.user_id == current_user.id).all()
    if not active_meds:
        return []
        
    interactions = []
    
    # Check interaction pairs in database (order independent)
    for active_med in active_meds:
        # Match both directions: (proposed, active) or (active, proposed)
        match = db.query(DrugInteraction).filter(
            (
                (DrugInteraction.medicine_a.ilike(proposed_med)) & 
                (DrugInteraction.medicine_b.ilike(active_med.name))
            ) | (
                (DrugInteraction.medicine_a.ilike(active_med.name)) & 
                (DrugInteraction.medicine_b.ilike(proposed_med))
            )
        ).first()
        
        if match:
            interactions.append(InteractionResponse(
                medicine_a=match.medicine_a,
                medicine_b=match.medicine_b,
                severity=match.severity,
                description=match.description or "No detail description available."
            ))
            
    return interactions
