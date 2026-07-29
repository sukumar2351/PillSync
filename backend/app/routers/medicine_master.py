import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.medicine_models import MedicineMaster
from app.models.user_models import User
from app.services.auth_service import get_current_user, RoleChecker
from app.schemas.medicine_master_schemas import (
    MedicineMasterCreate,
    MedicineRequestCreate,
    MedicineMasterResponse
)

router = APIRouter(prefix="/medicine-master", tags=["Medicine Master Database"])

# Permissions
admin_only = RoleChecker(allowed_roles=["admin"])
auth_required = RoleChecker(allowed_roles=["admin", "patient", "caregiver", "doctor"])

def sanitize_medicine_name(name: str) -> str:
    # Reject HTML tags
    if re.search(r"<[^>]*>", name):
        raise HTTPException(status_code=400, detail="Invalid medicine name. HTML tag content is rejected.")
    
    # Reject common SQL injection keywords/patterns
    sql_patterns = [r"\bselect\b", r"\binsert\b", r"\bdelete\b", r"\bdrop\b", r"\bupdate\b", r"--", r"\bunion\b", r";"]
    for pattern in sql_patterns:
        if re.search(pattern, name, re.IGNORECASE):
            raise HTTPException(status_code=400, detail="Invalid medicine name. SQL command patterns are rejected.")
            
    # Remove any special character that is not alphanumeric, space, dot, hyphen, slash or parenthesis
    sanitized = re.sub(r"[^\w\s\.\-\/\(\)]", "", name)
    sanitized = " ".join(sanitized.split()) # strip extra spaces
    if not sanitized:
        raise HTTPException(status_code=400, detail="Invalid medicine name after sanitization.")
    return sanitized

@router.get("/search", response_model=List[MedicineMasterResponse])
def search_medicine(q: str, db: Session = Depends(get_db), current_user: User = Depends(auth_required)):
    """Instant autocomplete search for approved medicines in the master list."""
    if len(q.strip()) < 1:
        return []
    
    # Simple case-insensitive match
    results = db.query(MedicineMaster).filter(
        MedicineMaster.name.ilike(f"%{q}%"),
        MedicineMaster.approval_status == "Approved"
    ).limit(10).all()
    return results

@router.get("/pending", response_model=List[MedicineMasterResponse])
def get_pending_requests(db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Retrieve all pending medicine requests (Admin only)."""
    return db.query(MedicineMaster).filter(MedicineMaster.approval_status == "Pending").all()

@router.post("/request", response_model=MedicineMasterResponse, status_code=status.HTTP_201_CREATED)
def request_new_medicine(payload: MedicineRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(auth_required)):
    """Submit a request for a new medicine to be approved and added to the master list."""
    sanitized_name = sanitize_medicine_name(payload.name)

    # Check duplicate
    existing = db.query(MedicineMaster).filter(MedicineMaster.name.ilike(sanitized_name)).first()
    if existing:
        if existing.approval_status == "Approved":
            raise HTTPException(status_code=400, detail=f"Medicine '{sanitized_name}' already exists in the master database.")
        else:
            raise HTTPException(status_code=400, detail=f"A request for '{sanitized_name}' is already pending review.")

    # Create pending entry
    new_med = MedicineMaster(
        name=sanitized_name,
        generic_name=payload.generic_name,
        medicine_type=payload.medicine_type,
        strength=payload.strength,
        unit=payload.unit,
        category=payload.category,
        approval_status="Pending"
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

@router.put("/{id}/approve", response_model=MedicineMasterResponse)
def approve_medicine(id: int, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Approve a pending medicine request and add it to the active master list (Admin only)."""
    med = db.query(MedicineMaster).filter(MedicineMaster.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine request not found.")
    
    med.approval_status = "Approved"
    db.commit()
    db.refresh(med)
    return med

@router.post("/", response_model=MedicineMasterResponse, status_code=status.HTTP_201_CREATED)
def create_medicine_direct(payload: MedicineMasterCreate, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Directly insert a new approved medicine into the master list (Admin only)."""
    sanitized_name = sanitize_medicine_name(payload.name)
    
    existing = db.query(MedicineMaster).filter(MedicineMaster.name.ilike(sanitized_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Medicine '{sanitized_name}' already exists.")
        
    new_med = MedicineMaster(
        name=sanitized_name,
        generic_name=payload.generic_name,
        brand_name=payload.brand_name,
        medicine_type=payload.medicine_type,
        strength=payload.strength,
        unit=payload.unit,
        manufacturer=payload.manufacturer,
        description=payload.description,
        common_usage=payload.common_usage,
        side_effects=payload.side_effects,
        category=payload.category,
        approval_status="Approved"
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

@router.get("/", response_model=List[MedicineMasterResponse])
def get_all_approved_medicines(db: Session = Depends(get_db), current_user: User = Depends(auth_required)):
    """Get all approved medicines in the database."""
    return db.query(MedicineMaster).filter(MedicineMaster.approval_status == "Approved").all()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(id: int, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Delete a medicine from the master database (Admin only)."""
    med = db.query(MedicineMaster).filter(MedicineMaster.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    db.delete(med)
    db.commit()
    return None
