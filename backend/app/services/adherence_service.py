"""
Adherence Analytics Service — Milestone-3
Computes medication adherence metrics per user:
  - Adherence %
  - Taken doses
  - Missed doses
  - Late doses
  - Current streak
  - Longest streak

Uses actual MedicationHistory columns:
  status (from time_of_day field — NOTE: status is not a column;
  uses scheduled_date + action_time for streak calculation)
"""
import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.user_models import Medicine, MedicationHistory
from app.database import SessionLocal

logger = logging.getLogger(__name__)


def compute_adherence_for_user(db: Session, user_id: int) -> dict:
    """Calculate adherence metrics for a single user."""
    medicines = db.query(Medicine).filter(Medicine.user_id == user_id).all()

    total_doses = 0
    taken = 0
    missed = 0
    late = 0

    all_taken_dates = set()

    for med in medicines:
        history = (
            db.query(MedicationHistory)
            .filter(MedicationHistory.medicine_id == med.id)
            .all()
        )
        for record in history:
            total_doses += 1
            # MedicationHistory uses 'status' column via time_of_day mapping
            # The actual status values depend on the application logic
            # We use the 'status' field from the history record directly
            status = ""
            # Try common attribute names
            if hasattr(record, "status") and record.status:
                status = str(record.status).lower()
            elif hasattr(record, "time_of_day") and record.time_of_day:
                status = str(record.time_of_day).lower()

            if status in ("taken", "completed", "done"):
                taken += 1
                # Track date for streak
                if hasattr(record, "action_time") and record.action_time:
                    all_taken_dates.add(record.action_time.date())
                elif hasattr(record, "scheduled_date") and record.scheduled_date:
                    all_taken_dates.add(record.scheduled_date)
            elif status in ("missed", "skipped"):
                missed += 1
            elif status in ("late", "delayed"):
                late += 1

    adherence_pct = round((taken / total_doses * 100), 1) if total_doses > 0 else 0.0

    # --- Streak calculation ---
    sorted_dates = sorted(all_taken_dates)
    longest_streak = 0
    streak = 0

    for i, d in enumerate(sorted_dates):
        if i == 0:
            streak = 1
        elif (d - sorted_dates[i - 1]).days == 1:
            streak += 1
        else:
            streak = 1
        longest_streak = max(longest_streak, streak)

    # Current streak: count backwards from today
    current_streak = 0
    today = date.today()
    check_day = today
    while check_day in all_taken_dates:
        current_streak += 1
        check_day -= timedelta(days=1)

    return {
        "user_id": user_id,
        "total_doses": total_doses,
        "taken": taken,
        "missed": missed,
        "late": late,
        "adherence_pct": adherence_pct,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
    }


def compute_adherence_metrics():
    """APScheduler daily job — compute adherence for all users and log results."""
    db: Session = SessionLocal()
    try:
        from app.models.user_models import User
        from app.models.dosage_analysis_models import AdherenceMetric
        users = db.query(User).all()
        for user in users:
            metrics = compute_adherence_for_user(db, user.id)
            
            # Save or update AdherenceMetric
            metric_record = db.query(AdherenceMetric).filter(AdherenceMetric.user_id == user.id).first()
            if not metric_record:
                metric_record = AdherenceMetric(user_id=user.id)
                db.add(metric_record)
            
            metric_record.total_doses = metrics["total_doses"]
            metric_record.taken = metrics["taken"]
            metric_record.missed = metrics["missed"]
            metric_record.late = metrics["late"]
            metric_record.adherence_pct = int(metrics["adherence_pct"])
            metric_record.current_streak = metrics["current_streak"]
            metric_record.longest_streak = metrics["longest_streak"]

            logger.info(
                "Adherence for user %d: %.1f%% (%d taken / %d missed / %d late) | "
                "Streak: current=%d longest=%d",
                user.id,
                metrics["adherence_pct"],
                metrics["taken"],
                metrics["missed"],
                metrics["late"],
                metrics["current_streak"],
                metrics["longest_streak"],
            )
        db.commit()
        logger.info("Adherence analytics complete for %d users.", len(users))
    except Exception as exc:
        logger.exception("Adherence analytics job failed: %s", exc)
        db.rollback()
    finally:
        db.close()
