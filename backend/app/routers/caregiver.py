from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.user_models import User, PatientProfile, CaregiverProfile, MedicationHistory, Medicine, ReminderSchedule, Notification, NotificationSetting
from app.services.auth_service import get_current_user, RoleChecker
from app.schemas.user_schemas import CaregiverProfileUpdate, CaregiverProfileResponse
from app.services.user_service import update_caregiver_profile

router = APIRouter(prefix="/caregivers", tags=["Caregiver Operations"])
singular_router = APIRouter(prefix="/caregiver", tags=["Caregiver Singular Operations"])

caregiver_only = RoleChecker(allowed_roles=["caregiver"])

@router.get("/patients", response_model=List[Dict[str, Any]])
def get_assigned_patients(db: Session = Depends(get_db), current_user: User = Depends(caregiver_only)):
    """Retrieve all patients assigned to the currently authenticated caregiver."""
    cg_profile = current_user.caregiver_profile
    if not cg_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found.")
    
    # Query patient profiles where caregiver_id links to this caregiver profile, or match by full_name pattern matching as fallback
    patients = db.query(PatientProfile).filter(
        (PatientProfile.caregiver_id == cg_profile.id) |
        (PatientProfile.emergency_contact.like(f"%{cg_profile.full_name}%"))
    ).all()

    response = []
    for p in patients:
        # Calculate adherence rate
        history_logs = db.query(MedicationHistory).filter(MedicationHistory.user_id == p.user_id).all()
        total = len(history_logs)
        taken = sum(1 for h in history_logs if h.status == "Taken")
        adherence_rate = (taken / total * 100) if total > 0 else 100.0

        # Last activity
        last_log = db.query(MedicationHistory).filter(
            MedicationHistory.user_id == p.user_id
        ).order_by(MedicationHistory.action_time.desc()).first()
        last_activity = last_log.action_time.strftime("%Y-%m-%d %H:%M:%S") if last_log else "No recent activity"

        # Today's scheduled medicines
        today = date.today()
        today_meds = db.query(Medicine).filter(
            Medicine.user_id == p.user_id,
            Medicine.start_date <= today,
            Medicine.end_date >= today
        ).all()
        
        medicine_names = [m.name for m in today_meds]

        response.append({
            "id": p.user_id,
            "name": p.full_name,
            "email": p.user.email,
            "age": p.age,
            "gender": p.gender,
            "bloodGroup": p.blood_group,
            "phone": p.phone,
            "address": p.address,
            "emergency_contact": p.emergency_contact,
            "status": p.account_status,
            "adherence_rate": round(adherence_rate, 2),
            "last_activity": last_activity,
            "today_medicines": medicine_names
        })

    return response

@router.get("/patients/history", response_model=List[Dict[str, Any]])
def get_assigned_patients_history(db: Session = Depends(get_db), current_user: User = Depends(caregiver_only)):
    """Retrieve full medication history logs of all patients assigned to the caregiver."""
    cg_profile = current_user.caregiver_profile
    if not cg_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found.")

    patients = db.query(PatientProfile).filter(
        (PatientProfile.caregiver_id == cg_profile.id) |
        (PatientProfile.emergency_contact.like(f"%{cg_profile.full_name}%"))
    ).all()

    patient_user_ids = [p.user_id for p in patients]
    if not patient_user_ids:
        return []

    logs = db.query(MedicationHistory).filter(
        MedicationHistory.user_id.in_(patient_user_ids)
    ).order_by(MedicationHistory.action_time.desc()).all()

    result = []
    # Create patient names map for easy lookup
    names_map = {p.user_id: p.full_name for p in patients}

    for l in logs:
        result.append({
            "id": l.id,
            "patient_id": l.user_id,
            "patient_name": names_map.get(l.user_id, "Unknown Patient"),
            "medicine_name": l.medicine_name,
            "dosage": l.dosage,
            "time_of_day": l.time_of_day,
            "status": l.status,
            "action_time": l.action_time,
            "scheduled_date": l.scheduled_date
        })

    return result

@router.get("/dashboard/summary")
def get_caregiver_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(caregiver_only)):
    """Retrieve overall caregiver stats dashboard summary."""
    cg_profile = current_user.caregiver_profile
    if not cg_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found.")

    patients = db.query(PatientProfile).filter(
        (PatientProfile.caregiver_id == cg_profile.id) |
        (PatientProfile.emergency_contact.like(f"%{cg_profile.full_name}%"))
    ).all()

    total_patients = len(patients)
    patient_user_ids = [p.user_id for p in patients]

    # Calculate aggregate metrics
    total_doses = 0
    taken_doses = 0
    missed_doses = 0
    if patient_user_ids:
        history_logs = db.query(MedicationHistory).filter(MedicationHistory.user_id.in_(patient_user_ids)).all()
        total_doses = len(history_logs)
        taken_doses = sum(1 for h in history_logs if h.status == "Taken")
        missed_doses = sum(1 for h in history_logs if h.status == "Missed")

    overall_adherence = (taken_doses / total_doses * 100) if total_doses > 0 else 100.0

    return {
        "total_assigned_patients": total_patients,
        "overall_adherence_rate": round(overall_adherence, 2),
        "total_doses_logged": total_doses,
        "taken_doses_count": taken_doses,
        "missed_doses_count": missed_doses
    }


# ============================================================
# SINGULAR /caregiver ROUTER (OBJECTIVE COMPLIANCE)
# ============================================================

@singular_router.get("/patient/{patient_id}/history")
def get_patient_history_details(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(caregiver_only)):
    """Retrieve complete, detailed clinical details and logs for a specific patient."""
    cg_profile = current_user.caregiver_profile
    if not cg_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found.")

    # 1. Fetch Patient profile & user
    patient_user = db.query(User).filter(User.id == patient_id).first()
    if not patient_user or not patient_user.patient_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")

    p = patient_user.patient_profile

    # 2. Verify assignment authorization
    is_assigned = (p.caregiver_id == cg_profile.id) or (cg_profile.full_name in (p.emergency_contact or ""))
    if not is_assigned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Patient is not assigned to you.")

    # 3. Medicines List
    medicines = db.query(Medicine).filter(Medicine.user_id == patient_id).all()
    medicine_list = [{
        "id": m.id,
        "name": m.name,
        "dosage": m.dosage,
        "frequency": m.frequency,
        "instructions": m.notes or "Take as directed by physician"
    } for m in medicines]

    # 4. Medication History logs
    history_logs = db.query(MedicationHistory).filter(
        MedicationHistory.user_id == patient_id
    ).order_by(MedicationHistory.action_time.desc()).all()

    logs_list = [{
        "id": h.id,
        "date": h.scheduled_date.strftime("%Y-%m-%d") if h.scheduled_date else "",
        "time": h.action_time.strftime("%H:%M:%S") if h.action_time else h.time_of_day,
        "medicine": h.medicine_name,
        "status": h.status
    } for h in history_logs]

    # 5. Adherence Statistics calculation
    total_doses = len(history_logs)
    taken_doses = sum(1 for h in history_logs if h.status == "Taken")
    missed_doses = sum(1 for h in history_logs if h.status == "Missed")
    completion_rate = (taken_doses / total_doses * 100) if total_doses > 0 else 100.0

    # Weekly (past 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    weekly_logs = [h for h in history_logs if h.action_time and h.action_time >= seven_days_ago]
    total_weekly = len(weekly_logs)
    taken_weekly = sum(1 for h in weekly_logs if h.status == "Taken")
    weekly_rate = (taken_weekly / total_weekly * 100) if total_weekly > 0 else 100.0

    # Monthly (past 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    monthly_logs = [h for h in history_logs if h.action_time and h.action_time >= thirty_days_ago]
    total_monthly = len(monthly_logs)
    taken_monthly = sum(1 for h in monthly_logs if h.status == "Taken")
    monthly_rate = (taken_monthly / total_monthly * 100) if total_monthly > 0 else 100.0

    # 6. Today's lists categorisation
    completed_today = [l["medicine"] for l in logs_list if l["date"] == today.strftime("%Y-%m-%d") and l["status"] == "Taken"]
    missed_today = [l["medicine"] for l in logs_list if l["date"] == today.strftime("%Y-%m-%d") and l["status"] == "Missed"]
    
    # 7. Notifications preference & Email configuration audit
    notif_settings = db.query(NotificationSetting).filter(NotificationSetting.user_id == patient_id).first()
    browser_enabled = notif_settings.browser_notifications if notif_settings else True
    email_status = "Enabled" if (notif_settings and notif_settings.email_enabled) else "Disabled"

    return {
        "patient": {
            "id": p.user_id,
            "name": p.full_name,
            "age": p.age,
            "gender": p.gender,
            "bloodGroup": p.blood_group,
            "phone": p.phone,
            "address": p.address,
            "emergency_contact": p.emergency_contact,
            "status": p.account_status,
            "email": patient_user.email
        },
        "medicines": medicine_list,
        "history": logs_list,
        "adherence": {
            "weekly_rate": round(weekly_rate, 2),
            "monthly_rate": round(monthly_rate, 2),
            "total_missed": missed_doses,
            "completion_rate": round(completion_rate, 2)
        },
        "today_summary": {
            "completed": completed_today,
            "missed": missed_today
        },
        "notifications": {
            "browser_notifications": "Enabled" if browser_enabled else "Disabled",
            "email_reminder_status": email_status
        }
    }


@singular_router.put("/profile", response_model=Dict[str, str])
def update_profile_put(payload: CaregiverProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Full update caregiver profile."""
    if current_user.role.name != "caregiver":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only caregivers can edit caregiver profiles.")
    
    try:
        update_caregiver_profile(db, current_user, payload)
        return {"message": "Profile updated successfully"}
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(val_err))


@singular_router.patch("/profile", response_model=Dict[str, str])
def update_profile_patch(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Partial update caregiver profile."""
    if current_user.role.name != "caregiver":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only caregivers can edit caregiver profiles.")
    
    # 1. Fetch current profile data
    profile = current_user.caregiver_profile
    if not profile:
        profile = CaregiverProfile(user_id=current_user.id, full_name="Caregiver")
        db.add(profile)
        db.flush()

    # 2. Construct dynamic update payload merging existing states
    merged = {
        "full_name": payload.get("full_name", profile.full_name),
        "email": payload.get("email", current_user.email),
        "phone": payload.get("phone", profile.phone),
        "age": payload.get("age", profile.age),
        "gender": payload.get("gender", profile.gender),
        "address": payload.get("address", profile.address),
        "emergency_contact": payload.get("emergency_contact", profile.emergency_contact),
        "emergency_phone": payload.get("emergency_phone", profile.emergency_phone),
        "profile_photo": payload.get("profile_photo", profile.profile_photo),
    }

    try:
        validated = CaregiverProfileUpdate(**merged)
        update_caregiver_profile(db, current_user, validated)
        return {"message": "Profile updated successfully"}
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(val_err))
