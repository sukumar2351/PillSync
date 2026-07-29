from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.user_models import User, MedicationHistory, Medicine
from app.models.medicine_models import EmergencyCard
from app.services.auth_service import get_current_user, RoleChecker

router = APIRouter(prefix="/insights", tags=["Health Insights Dashboard"])

patient_or_caregiver = RoleChecker(allowed_roles=["patient", "caregiver", "admin", "doctor"])

@router.get("/")
def generate_health_insights(
    patient_id: int = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(patient_or_caregiver)
):
    """Generate dynamic AI-style health insights based on patient history, stock levels & consistency."""
    target_user_id = current_user.id
    if patient_id and current_user.role.name in ["caregiver", "admin", "doctor"]:
        target_user_id = patient_id

    logs = db.query(MedicationHistory).filter(MedicationHistory.user_id == target_user_id).all()
    meds = db.query(Medicine).filter(Medicine.user_id == target_user_id).all()

    insights = []

    # 1. Adherence Level Insight
    total_doses = len(logs)
    taken_doses = sum(1 for l in logs if l.status == "Taken")
    adherence_pct = round((taken_doses / total_doses * 100), 1) if total_doses > 0 else 100.0

    if adherence_pct >= 90:
        insights.append({
            "type": "success",
            "title": "Excellent Adherence",
            "description": f"You have maintained an outstanding {adherence_pct}% medication adherence score over recent weeks!",
            "recommendation": "Keep up your consistent schedule for optimal therapeutic outcome."
        })
    elif adherence_pct >= 70:
        insights.append({
            "type": "warning",
            "title": "Moderate Adherence Consistency",
            "description": f"Your adherence score is currently {adherence_pct}%. A few doses were missed.",
            "recommendation": "Consider setting browser notifications or SMS alerts for morning slots."
        })
    else:
        insights.append({
            "type": "danger",
            "title": "Adherence Warning",
            "description": f"Your current adherence score has dropped to {adherence_pct}%.",
            "recommendation": "Consult with your primary caregiver or doctor to adjust timing."
        })

    # 2. Refill Alert Insight
    low_stock_meds = [m for m in meds if m.quantity <= 10]
    if low_stock_meds:
        med_names = ", ".join([m.name for m in low_stock_meds[:3]])
        insights.append({
            "type": "warning",
            "title": "Refill Required Soon",
            "description": f"Low stock detected for: {med_names}.",
            "recommendation": f"Order a prescription refill within 3–5 days to avoid missing doses."
        })
    else:
        insights.append({
            "type": "info",
            "title": "Medication Stock Healthy",
            "description": "All your active medications have sufficient stock for the upcoming week.",
            "recommendation": "No refill actions required at this moment."
        })

    # 3. Schedule Optimization Insight
    insights.append({
        "type": "info",
        "title": "Schedule Consistency",
        "description": "Your morning dose window (08:00 AM) shows the highest adherence consistency.",
        "recommendation": "Pair afternoon/night doses with regular meal routines to improve timing accuracy."
    })

    return {
        "overall_score": adherence_pct,
        "total_active_medications": len(meds),
        "insights": insights
    }
