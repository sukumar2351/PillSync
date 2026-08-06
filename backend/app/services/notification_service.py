"""
Notification Service — Milestone-3
Generates in-app refill notifications based on RefillPrediction data.
Rules: send only ONE notification per threshold (7-day, 3-day, 1-day, finished).
Uses the existing Notification model columns: user_id, title, message, type, is_read.
Deduplication is done by querying notifications with matching title prefix.
"""
import logging
from datetime import date
from sqlalchemy.orm import Session
from app.models.refill_models import RefillPrediction
from app.models.user_models import Notification, Medicine
from app.database import SessionLocal

logger = logging.getLogger(__name__)

# Thresholds for notifications (days remaining)
THRESHOLDS = [7, 3, 1, 0]


def _notification_exists(db: Session, user_id: int, medicine_id: int, threshold: int) -> bool:
    """Check whether a notification for this threshold was already sent.
    Uses a unique type string for deduplication.
    """
    notif_type = f"refill_{medicine_id}_{threshold}d"
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == notif_type,
        )
        .first()
    )
    return existing is not None


def _create_notification(db: Session, user_id: int, medicine_id: int, medicine_name: str, threshold: int):
    """Create a single in-app notification for the given threshold."""
    notif_type = f"refill_{medicine_id}_{threshold}d"
    if threshold == 0:
        title = f"Stock Finished: {medicine_name}"
        message = f"Your medicine '{medicine_name}' has run out. Please refill immediately."
    elif threshold == 1:
        title = f"1 Day Remaining: {medicine_name}"
        message = f"Only 1 day supply left for '{medicine_name}'. Refill today."
    elif threshold == 3:
        title = f"3 Days Remaining: {medicine_name}"
        message = f"Only 3 days supply left for '{medicine_name}'. Please arrange a refill soon."
    else:
        title = f"{threshold} Days Remaining: {medicine_name}"
        message = f"Your medicine '{medicine_name}' will run out in {threshold} days. Plan your refill."

    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        is_read=False,
    )
    db.add(notif)


def generate_refill_notifications():
    """APScheduler daily job — scan RefillPrediction and create notifications."""
    db: Session = SessionLocal()
    today = date.today()
    try:
        predictions = db.query(RefillPrediction).all()
        created = 0
        for pred in predictions:
            days_left = (pred.expected_finish_date - today).days
            medicine = db.query(Medicine).filter(Medicine.id == pred.medicine_id).first()
            if not medicine:
                continue
            medicine_name = medicine.name

            for threshold in THRESHOLDS:
                if days_left <= threshold:
                    if not _notification_exists(db, pred.user_id, pred.medicine_id, threshold):
                        _create_notification(db, pred.user_id, pred.medicine_id, medicine_name, threshold)
                        created += 1

        db.commit()
        logger.info("Refill notification job complete — %d new notifications created.", created)
    except Exception as exc:
        logger.exception("Notification job failed: %s", exc)
        db.rollback()
    finally:
        db.close()
