"""
Dosage Analysis Service — Milestone-3
Detects medication conflicts: duplicates, frequency conflicts, timing conflicts, missed/extra doses.
"""
import logging
from typing import List
from sqlalchemy.orm import Session
from app.models.user_models import Medicine, MedicationHistory
from app.models.dosage_analysis_models import DosageAnalysisResult
from app.database import SessionLocal

logger = logging.getLogger(__name__)


def _get_time_slots(med: Medicine) -> List[str]:
    """Return a list of scheduled time slots for a medicine."""
    slots = []
    if med.morning:
        slots.append("morning")
    if med.afternoon:
        slots.append("afternoon")
    if med.night:
        slots.append("night")
    return slots


def analyze_medicines_for_user(db: Session, user_id: int) -> List[DosageAnalysisResult]:
    """Run dosage analysis for all medicines belonging to a user."""
    medicines = db.query(Medicine).filter(Medicine.user_id == user_id).all()
    results: List[DosageAnalysisResult] = []

    # --- Check 1: Duplicate medicines (same name, active at same time) ---
    name_map: dict = {}
    for med in medicines:
        key = med.name.strip().lower()
        if key in name_map:
            results.append(DosageAnalysisResult(
                user_id=user_id,
                medicine_id=med.id,
                severity="HIGH",
                issue="Duplicate medicine detected",
                details=(
                    f"'{med.name}' is prescribed more than once "
                    f"(IDs: {name_map[key]}, {med.id})"
                ),
            ))
        else:
            name_map[key] = med.id

    # --- Check 2: Same medicine scheduled at same time slot more than once ---
    slot_map: dict = {}
    for med in medicines:
        for slot in _get_time_slots(med):
            slot_key = (med.name.strip().lower(), slot)
            if slot_key in slot_map:
                results.append(DosageAnalysisResult(
                    user_id=user_id,
                    medicine_id=med.id,
                    severity="MEDIUM",
                    issue="Timing conflict — same medicine at same slot",
                    details=(
                        f"'{med.name}' scheduled at '{slot}' in "
                        f"multiple prescriptions (IDs: {slot_map[slot_key]}, {med.id})"
                    ),
                ))
            else:
                slot_map[slot_key] = med.id

    # --- Check 3: Frequency conflict — daily_doses > 3 (morning+afternoon+night = max 3) ---
    for med in medicines:
        slots = _get_time_slots(med)
        if len(slots) > 3:
            results.append(DosageAnalysisResult(
                user_id=user_id,
                medicine_id=med.id,
                severity="HIGH",
                issue="Overdose risk — frequency exceeds 3 doses per day",
                details=f"'{med.name}' has {len(slots)} doses/day which is unusual.",
            ))

    # --- Check 4: Missed doses from history ---
    for med in medicines:
        missed = (
            db.query(MedicationHistory)
            .filter(
                MedicationHistory.medicine_id == med.id,
                MedicationHistory.status == "missed",
            )
            .count()
        )
        if missed >= 3:
            severity = "HIGH" if missed >= 7 else "MEDIUM"
            results.append(DosageAnalysisResult(
                user_id=user_id,
                medicine_id=med.id,
                severity=severity,
                issue="Frequent missed doses detected",
                details=f"'{med.name}' has {missed} missed dose(s) recorded.",
            ))

    # --- Check 5: Extra doses from history ---
    for med in medicines:
        from sqlalchemy import func
        extra_doses = (
            db.query(MedicationHistory.scheduled_date, MedicationHistory.time_of_day, func.count(MedicationHistory.id).label("c"))
            .filter(
                MedicationHistory.medicine_id == med.id,
                MedicationHistory.status.in_(["taken", "completed", "done", "Taken", "Completed", "Done"])
            )
            .group_by(MedicationHistory.scheduled_date, MedicationHistory.time_of_day)
            .having(func.count(MedicationHistory.id) > 1)
            .all()
        )
        for date_val, time_val, count in extra_doses:
            results.append(DosageAnalysisResult(
                user_id=user_id,
                medicine_id=med.id,
                severity="HIGH",
                issue="Extra dose detected",
                details=f"'{med.name}' has {count} doses recorded for {date_val} at {time_val} (expected 1).",
            ))

    return results


def run_dosage_analysis():
    """APScheduler daily job — run dosage analysis for all users."""
    db: Session = SessionLocal()
    try:
        from app.models.user_models import User
        users = db.query(User).all()
        total_issues = 0
        for user in users:
            results = analyze_medicines_for_user(db, user.id)
            for r in results:
                db.add(r)
            total_issues += len(results)
        db.commit()
        logger.info("Dosage analysis complete — %d issues found across %d users.", total_issues, len(users))
    except Exception as exc:
        logger.exception("Dosage analysis job failed: %s", exc)
        db.rollback()
    finally:
        db.close()
