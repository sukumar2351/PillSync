from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.user_models import User, MedicationHistory, Medicine
from app.services.auth_service import get_current_user, RoleChecker

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

patient_or_caregiver = RoleChecker(allowed_roles=["patient", "caregiver", "admin"])

@router.get("/summary")
def get_reports_summary(
    patient_id: int = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(patient_or_caregiver)
):
    """Retrieve overarching adherence summary statistics."""
    target_user_id = current_user.id
    if patient_id and current_user.role.name in ["caregiver", "admin"]:
        target_user_id = patient_id

    logs = db.query(MedicationHistory).filter(MedicationHistory.user_id == target_user_id).all()
    
    total = len(logs)
    taken = sum(1 for l in logs if l.status == "Taken")
    missed = sum(1 for l in logs if l.status == "Missed")
    snoozed = sum(1 for l in logs if l.status == "Snoozed")
    
    adherence_pct = round((taken / total * 100), 1) if total > 0 else 100.0
    consistency_score = min(100, round(adherence_pct * 0.95 + (5 if missed == 0 else 0), 1))
    
    # Calculate streak (consecutive days with 100% adherence)
    streak = 0
    today = date.today()
    for i in range(30):
        day = today - timedelta(days=i)
        day_logs = [l for l in logs if l.scheduled_date == day]
        if not day_logs:
            continue
        day_taken = sum(1 for l in day_logs if l.status == "Taken")
        if day_taken == len(day_logs):
            streak += 1
        else:
            break
            
    return {
        "total_doses": total,
        "taken_doses": taken,
        "missed_doses": missed,
        "snoozed_doses": snoozed,
        "adherence_percentage": adherence_pct,
        "consistency_score": consistency_score,
        "current_streak_days": streak
    }

@router.get("/adherence/daily")
def get_daily_adherence(
    days: int = 30,
    patient_id: int = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(patient_or_caregiver)
):
    """Daily adherence trend over the specified number of past days."""
    target_user_id = current_user.id
    if patient_id and current_user.role.name in ["caregiver", "admin"]:
        target_user_id = patient_id

    today = date.today()
    start_day = today - timedelta(days=days - 1)
    
    logs = db.query(MedicationHistory).filter(
        MedicationHistory.user_id == target_user_id,
        MedicationHistory.scheduled_date >= start_day
    ).all()
    
    daily_data = []
    for i in range(days):
        day = start_day + timedelta(days=i)
        day_logs = [l for l in logs if l.scheduled_date == day]
        
        taken = sum(1 for l in day_logs if l.status == "Taken")
        missed = sum(1 for l in day_logs if l.status == "Missed")
        total = len(day_logs)
        pct = round((taken / total * 100), 1) if total > 0 else 0.0
        
        daily_data.append({
            "date": day.strftime("%Y-%m-%d"),
            "day": day.strftime("%b %d"),
            "taken": taken,
            "missed": missed,
            "total": total,
            "adherence": pct
        })
        
    return daily_data

@router.get("/adherence/weekly")
def get_weekly_adherence(
    weeks: int = 12,
    patient_id: int = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(patient_or_caregiver)
):
    """Weekly aggregated adherence trend over the specified number of past weeks."""
    target_user_id = current_user.id
    if patient_id and current_user.role.name in ["caregiver", "admin"]:
        target_user_id = patient_id

    today = date.today()
    start_day = today - timedelta(weeks=weeks)
    
    logs = db.query(MedicationHistory).filter(
        MedicationHistory.user_id == target_user_id,
        MedicationHistory.scheduled_date >= start_day
    ).all()
    
    weekly_data = []
    for i in range(weeks):
        w_start = today - timedelta(weeks=weeks - 1 - i, days=today.weekday())
        w_end = w_start + timedelta(days=6)
        
        week_logs = [l for l in logs if w_start <= l.scheduled_date <= w_end]
        taken = sum(1 for l in week_logs if l.status == "Taken")
        missed = sum(1 for l in week_logs if l.status == "Missed")
        total = len(week_logs)
        pct = round((taken / total * 100), 1) if total > 0 else 0.0
        
        weekly_data.append({
            "week": f"W{i+1} ({w_start.strftime('%b %d')})",
            "start_date": w_start.strftime("%Y-%m-%d"),
            "taken": taken,
            "missed": missed,
            "total": total,
            "adherence": pct
        })
        
    return weekly_data
