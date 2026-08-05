import logging
from datetime import timedelta
from sqlalchemy.orm import Session
from app.models.refill_models import RefillPrediction
from app.models.user_models import Medicine
from app.database import SessionLocal

logger = logging.getLogger(__name__)

def calculate_refill(medicine: Medicine) -> RefillPrediction:
    """Calculate remaining quantity, expected finish date, and predicted refill date.
    Uses a 2‑day buffer before the expected finish date.
    """
    # Determine daily dose count (boolean fields indicating scheduled doses)
    daily_doses = sum([medicine.morning, medicine.afternoon, medicine.night]) or 1
    # Estimate days until depletion based on current quantity
    days_until_empty = medicine.quantity // daily_doses
    expected_finish = medicine.start_date + timedelta(days=days_until_empty)
    predicted_refill = expected_finish - timedelta(days=2)  # 2‑day buffer
    return RefillPrediction(
        user_id=medicine.user_id,
        medicine_id=medicine.id,
        remaining_quantity=medicine.quantity,
        expected_finish_date=expected_finish,
        predicted_refill_date=predicted_refill,
    )

def run_daily_refill_job():
    """APS​scheduler job: update/create refill predictions for all medicines."""
    db: Session = SessionLocal()
    try:
        medicines = db.query(Medicine).all()
        for med in medicines:
            pred = calculate_refill(med)
            existing = (
                db.query(RefillPrediction)
                .filter(
                    RefillPrediction.user_id == pred.user_id,
                    RefillPrediction.medicine_id == pred.medicine_id,
                )
                .first()
            )
            if existing:
                existing.remaining_quantity = pred.remaining_quantity
                existing.expected_finish_date = pred.expected_finish_date
                existing.predicted_refill_date = pred.predicted_refill_date
            else:
                db.add(pred)
        db.commit()
        logger.info("Refill predictions updated for %d medicines", len(medicines))
    except Exception as exc:
        logger.exception("Error while calculating refill predictions: %s", exc)
        db.rollback()
    finally:
        db.close()
