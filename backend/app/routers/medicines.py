import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.user_models import User, Medicine, ReminderSchedule, MedicationHistory, Notification

from app.services.auth_service import get_current_user, RoleChecker
from app.schemas.user_schemas import (
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse,
    ReminderLogRequest,
    MedicationHistoryResponse,
    AdherenceStatsResponse
)

logger = logging.getLogger("pillsync.medicines")

router = APIRouter(prefix="/medicines", tags=["Medicines & Reminders"])

# Dependencies
patient_or_caregiver = RoleChecker(allowed_roles=["patient", "caregiver"])
patient_only = RoleChecker(allowed_roles=["patient"])

@router.post("/", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def add_medicine(payload: MedicineCreate, db: Session = Depends(get_db), current_user: User = Depends(patient_only)):
    """Create a new medicine and generate its default reminder schedules."""
    # Ensure patient role
    db_med = Medicine(
        user_id=current_user.id,
        name=payload.name,
        dosage=payload.dosage,
        quantity=payload.quantity,
        frequency=payload.frequency,
        morning=payload.morning,
        afternoon=payload.afternoon,
        night=payload.night,
        food_relation=payload.food_relation,
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes
    )
    db.add(db_med)
    db.flush()  # Acquire db_med.id

    # Create schedules based on toggles
    schedules = []
    if payload.morning:
        s = ReminderSchedule(medicine_id=db_med.id, time_of_day="Morning", scheduled_time="08:00")
        db.add(s)
        schedules.append(s)
    if payload.afternoon:
        s = ReminderSchedule(medicine_id=db_med.id, time_of_day="Afternoon", scheduled_time="14:00")
        db.add(s)
        schedules.append(s)
    if payload.night:
        s = ReminderSchedule(medicine_id=db_med.id, time_of_day="Night", scheduled_time="20:00")
        db.add(s)
        schedules.append(s)

    db.commit()
    db.refresh(db_med)
    return db_med

@router.get("/", response_model=List[MedicineResponse])
def get_medicines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all active medicines for the patient or requested patient ID."""
    if current_user.role.name == "patient":
        return db.query(Medicine).filter(Medicine.user_id == current_user.id).all()
    else:
        # Caregiver/Admin can view all (filter matches requested query in subsequent integrations)
        return db.query(Medicine).all()

@router.put("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(medicine_id: int, payload: MedicineUpdate, db: Session = Depends(get_db), current_user: User = Depends(patient_only)):
    """Modify a medicine's attributes and regenerate schedules."""
    db_med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.user_id == current_user.id).first()
    if not db_med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")

    # Update base fields
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_med, key, value)

    # Regenerate schedules if morning/afternoon/night toggles are updated
    if any(k in update_data for k in ["morning", "afternoon", "night"]):
        # Delete old schedules
        db.query(ReminderSchedule).filter(ReminderSchedule.medicine_id == db_med.id).delete()
        
        # Create new ones
        if db_med.morning:
            db.add(ReminderSchedule(medicine_id=db_med.id, time_of_day="Morning", scheduled_time="08:00"))
        if db_med.afternoon:
            db.add(ReminderSchedule(medicine_id=db_med.id, time_of_day="Afternoon", scheduled_time="14:00"))
        if db_med.night:
            db.add(ReminderSchedule(medicine_id=db_med.id, time_of_day="Night", scheduled_time="20:00"))

    db.commit()
    db.refresh(db_med)
    return db_med

@router.delete("/{medicine_id}", status_code=status.HTTP_200_OK)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db), current_user: User = Depends(patient_only)):
    """Remove a medicine from the database."""
    db_med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.user_id == current_user.id).first()
    if not db_med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")

    db.delete(db_med)
    db.commit()
    return {"message": "Medicine deleted successfully"}

@router.get("/reminders/today")
def get_reminders_today(db: Session = Depends(get_db), current_user: User = Depends(patient_only)):
    """Retrieve all reminder schedules for today with logged status and trigger SMS if configured."""
    today = date.today()
    profile = current_user.patient_profile
    patient_name = profile.full_name if profile else "Patient"

    logger.info(f"[Reminders] Fetching today's reminders for user_id={current_user.id} ({patient_name}) on {today}")

    # Ensure notification settings row exists
    from app.models.user_models import NotificationSetting
    settings = current_user.notification_setting
    if not settings:
        default_phone = profile.phone if profile else None
        logger.info(f"[Reminders] Creating default NotificationSetting for user_id={current_user.id}")
        settings = NotificationSetting(
            user_id=current_user.id,
            phone_number=default_phone,
            sms_enabled=False,
            browser_notifications=True,
            notification_frequency="Daily",
            delivery_status="Not Configured"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    logger.info(
        f"[Reminders] Notification settings: email_enabled={settings.sms_enabled}, "
        f"email={current_user.email}, "
        f"last_email_sent={settings.last_sms_sent}"
    )

    # Fetch all active medicines for the patient
    medicines = db.query(Medicine).filter(
        Medicine.user_id == current_user.id,
        Medicine.start_date <= today,
        Medicine.end_date >= today
    ).all()
    logger.info(f"[Reminders] Found {len(medicines)} active medicine(s) for today.")

    from app.services.email_service import send_medicine_reminder

    # Deduplication: track which (medicine_id, time_of_day) combos got an Email today
    # We check last_sms_sent date — if it is already today, skip re-sending
    email_sent_today = (
        settings.last_sms_sent is not None
        and settings.last_sms_sent.date() == today
    )

    reminders = []
    email_dispatched_count = 0

    for med in medicines:
        for sched in med.reminder_schedules:
            # Check if logged today
            logged = db.query(MedicationHistory).filter(
                MedicationHistory.user_id == current_user.id,
                MedicationHistory.medicine_id == med.id,
                MedicationHistory.time_of_day == sched.time_of_day,
                MedicationHistory.scheduled_date == today
            ).first()

            reminder_status = logged.status if logged else "Pending"

            # Email dispatch logic
            email_eligible = (
                reminder_status == "Pending"
                and settings.sms_enabled
                and not email_sent_today   # Only send once per calendar day
            )

            if email_eligible:
                target_email = settings.notification_email or current_user.email
                logger.info(
                    f"[Reminders] Dispatching LIVE Email Reminder for medicine='{med.name}' "
                    f"({sched.time_of_day}) to {target_email}"
                )
                try:
                    res = send_medicine_reminder(
                        patient_name,
                        med.name,
                        med.dosage,
                        sched.time_of_day,
                        target_email
                    )
                except Exception as cred_err:
                    logger.error(f"[Reminders] Email skipped — configuration failure: {cred_err}")
                    res = {"status": "failed", "error": str(cred_err)}

                email_dispatched_count += 1

                # Persist full audit trail in existing columns
                settings.last_sms_sent = datetime.utcnow()
                settings.sms_recipient = res.get("to", current_user.email)
                if res.get("status") == "success":
                    settings.delivery_status = res.get("delivery_status", "sent")
                    settings.sms_message_sid = "Gmail-SMTP"
                    settings.sms_error = None
                    
                    # Create a database notification for the patient
                    notif = Notification(
                        user_id=current_user.id,
                        title=f"Medicine Reminder: {med.name}",
                        message=f"Scheduled dose of {med.name} ({med.dosage}) for {sched.time_of_day} was dispatched via Email to {settings.sms_recipient}.",
                        type="reminder",
                        is_read=False,
                        created_at=datetime.utcnow()
                    )
                    db.add(notif)
                else:
                    settings.delivery_status = "failed"
                    settings.sms_error = res.get("error", "Unknown error")
                    settings.sms_message_sid = None
                    
                    # Create a database notification for the patient about failure
                    notif = Notification(
                        user_id=current_user.id,
                        title=f"Failed Reminder Dispatch: {med.name}",
                        message=f"Reminder Email dispatch for {med.name} ({sched.time_of_day}) to {current_user.email} failed. Error: {settings.sms_error}",
                        type="system",
                        is_read=False,
                        created_at=datetime.utcnow()
                    )
                    db.add(notif)
                db.commit()
                email_sent_today = True  # Prevent further sends in this request
                logger.info(f"[Reminders] Email result: status={res.get('status')}, error={res.get('error')}")
            elif reminder_status == "Pending" and settings.sms_enabled and email_sent_today:
                logger.info(
                    f"[Reminders] Email skipped for '{med.name}' ({sched.time_of_day}) "
                    f"— already sent today at {settings.last_sms_sent}"
                )
            elif reminder_status == "Pending" and not settings.sms_enabled:
                logger.info(
                    f"[Reminders] Email skipped for '{med.name}' ({sched.time_of_day}) "
                    f"— Email reminders are disabled for this patient."
                )

            reminders.append({
                "id": f"{med.id}-{sched.time_of_day}",
                "medicine_id": med.id,
                "name": med.name,
                "dosage": med.dosage,
                "time_of_day": sched.time_of_day,
                "scheduled_time": sched.scheduled_time,
                "food_relation": med.food_relation,
                "status": reminder_status,
                "action_time": logged.action_time if logged else None
            })

    logger.info(
        f"[Reminders] Returning {len(reminders)} reminder(s). "
        f"SMS dispatched this request: {sms_dispatched_count}."
    )
    return reminders

@router.post("/{medicine_id}/reminders/log", response_model=MedicationHistoryResponse)
def log_reminder(medicine_id: int, payload: ReminderLogRequest, db: Session = Depends(get_db), current_user: User = Depends(patient_only)):
    """Log an action (Taken, Missed, Snoozed) for a medicine schedule."""
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")

    # Check if there is an existing log for today and time of day
    existing_log = db.query(MedicationHistory).filter(
        MedicationHistory.user_id == current_user.id,
        MedicationHistory.medicine_id == medicine_id,
        MedicationHistory.time_of_day == payload.time_of_day,
        MedicationHistory.scheduled_date == payload.scheduled_date
    ).first()

    if existing_log:
        existing_log.status = payload.status
        existing_log.action_time = datetime.now()
        db_log = existing_log
    else:
        db_log = MedicationHistory(
            user_id=current_user.id,
            medicine_id=medicine_id,
            medicine_name=med.name,
            dosage=med.dosage,
            time_of_day=payload.time_of_day,
            status=payload.status,
            action_time=datetime.now(),
            scheduled_date=payload.scheduled_date
        )
        db.add(db_log)

    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/history", response_model=AdherenceStatsResponse)
def get_adherence_history(db: Session = Depends(get_db), current_user: User = Depends(patient_only)):
    """Get history logs and stats for the logged-in patient."""
    history_logs = db.query(MedicationHistory).filter(
        MedicationHistory.user_id == current_user.id
    ).order_by(MedicationHistory.action_time.desc()).all()

    # Calculate statistics
    total = len(history_logs)
    taken = sum(1 for h in history_logs if h.status == "Taken")
    missed = sum(1 for h in history_logs if h.status == "Missed")
    snoozed = sum(1 for h in history_logs if h.status == "Snoozed")
    
    rate = (taken / total * 100) if total > 0 else 100.0

    return {
        "total_scheduled": total,
        "taken_count": taken,
        "missed_count": missed,
        "snoozed_count": snoozed,
        "adherence_rate": round(rate, 2),
        "history": history_logs
    }

@router.get("/history/patient/{patient_user_id}", response_model=AdherenceStatsResponse)
def get_patient_history_for_caregiver(patient_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(patient_or_caregiver)):
    """Allows caregivers or patient to retrieve stats for a specific patient."""
    # If the current user is a patient, make sure they only view their own history
    if current_user.role.name == "patient" and current_user.id != patient_user_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access other patient's history.")

    history_logs = db.query(MedicationHistory).filter(
        MedicationHistory.user_id == patient_user_id
    ).order_by(MedicationHistory.action_time.desc()).all()

    total = len(history_logs)
    taken = sum(1 for h in history_logs if h.status == "Taken")
    missed = sum(1 for h in history_logs if h.status == "Missed")
    snoozed = sum(1 for h in history_logs if h.status == "Snoozed")
    
    rate = (taken / total * 100) if total > 0 else 100.0

    return {
        "total_scheduled": total,
        "taken_count": taken,
        "missed_count": missed,
        "snoozed_count": snoozed,
        "adherence_rate": round(rate, 2),
        "history": history_logs
    }

@router.get("/history/patient/email/{email}", response_model=AdherenceStatsResponse)
def get_patient_history_by_email(email: str, db: Session = Depends(get_db), current_user: User = Depends(patient_or_caregiver)):
    """Retrieve stats and logs for a patient by their email address."""
    patient = db.query(User).filter(User.email == email).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient user not found.")
    
    return get_patient_history_for_caregiver(patient_user_id=patient.id, db=db, current_user=current_user)

