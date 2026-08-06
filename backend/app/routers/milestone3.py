from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.refill_models import RefillPrediction
from app.models.dosage_analysis_models import DosageAnalysisResult, AdherenceMetric
from app.models.user_models import Notification, User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api", tags=["Milestone-3 APIs"])

@router.get("/refill/predictions")
def get_refill_predictions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all refill predictions for the authenticated user."""
    results = db.query(RefillPrediction).filter(RefillPrediction.user_id == current_user.id).all()
    return {"predictions": [
        {
            "id": r.id,
            "user_id": r.user_id,
            "medicine_id": r.medicine_id,
            "remaining_quantity": r.remaining_quantity,
            "expected_finish_date": r.expected_finish_date,
            "predicted_refill_date": r.predicted_refill_date,
        } for r in results
    ]}

@router.get("/dosage-analysis")
def get_dosage_analysis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all dosage analysis results for the authenticated user."""
    results = db.query(DosageAnalysisResult).filter(DosageAnalysisResult.user_id == current_user.id).all()
    return {"analysis_results": [
        {
            "id": r.id,
            "user_id": r.user_id,
            "medicine_id": r.medicine_id,
            "severity": r.severity,
            "issue": r.issue,
            "details": r.details,
        } for r in results
    ]}

@router.get("/analytics/adherence")
def get_adherence_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return historical adherence metrics for the authenticated user."""
    metrics = db.query(AdherenceMetric).filter(AdherenceMetric.user_id == current_user.id).first()
    if not metrics:
        return {"adherence": []}
        
    return {"adherence": [
        {
            "id": metrics.id,
            "user_id": metrics.user_id,
            "total_doses": metrics.total_doses,
            "taken": metrics.taken,
            "missed": metrics.missed,
            "late": metrics.late,
            "adherence_pct": metrics.adherence_pct,
            "current_streak": metrics.current_streak,
            "longest_streak": metrics.longest_streak,
            "calculated_at": metrics.calculated_at
        }
    ]}
