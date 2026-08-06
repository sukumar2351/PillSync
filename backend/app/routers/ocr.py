import re
import os
import io
import json
import logging
import mimetypes
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.medicine_models import MedicineMaster, OCRRecord
from app.models.user_models import User, Medicine, ReminderSchedule
from app.services.auth_service import get_current_user, RoleChecker
from app.services.gemini_service import gemini_service

logger = logging.getLogger("pillsync.ocr")

router = APIRouter(prefix="/ocr", tags=["Prescription Recognition - Google Gemini Vision"])

auth_required = RoleChecker(allowed_roles=["admin", "patient", "caregiver", "doctor"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "prescriptions")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# RapidFuzz Import
RAPIDFUZZ_AVAILABLE = False
try:
    from rapidfuzz import fuzz, process
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    import difflib

# Metadata Noise Blacklist
NOISE_KEYWORDS = [
    "doctor", "dr.", "dr ", "m.d", "mbbs", "bams", "bhms", "qualification", "reg", "registration",
    "hospital", "clinic", "medical center", "healthcare", "address", "phone", "tel", "mob", "contact",
    "email", "website", "www.", "http", "patient", "pt.", "age", "gender", "male", "female", "b.p",
    "weight", "kg", "bmi", "rx", "date", "diagnosis", "signature", "stamp", "advice", "investigation"
]

class SaveMedicineItem(BaseModel):
    name: str = Field(..., min_length=1)
    brand_name: Optional[str] = None
    generic_name: Optional[str] = None
    strength: Optional[str] = "500 mg"
    dosage: str = Field(..., min_length=1)
    frequency: str = Field("Once Daily")
    duration: Optional[str] = "7 Days"
    timing: Optional[str] = "Morning, Night"
    food: Optional[str] = "After Food"
    instructions: Optional[str] = None

class SaveMedicinesBatchRequest(BaseModel):
    filename: Optional[str] = "prescription.jpg"
    file_type: Optional[str] = "JPG"
    file_size_bytes: Optional[int] = 0
    medicines: List[SaveMedicineItem]

def fuzzy_match_with_master(candidate_name: str, master_meds: List[MedicineMaster]) -> tuple:
    """
    Compare extracted medicine against Medicine Master database using RapidFuzz.
    If similarity ratio >= 80%, automatically correct spelling mistakes.
    Never replace a medicine with an unrelated medicine.
    """
    clean_cand = re.sub(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|iu|%)\b", "", candidate_name, flags=re.IGNORECASE).strip()
    clean_cand = re.sub(r"[^\w\s]", "", clean_cand).strip()

    if not clean_cand or len(clean_cand) < 2:
        return None, 0.0, "Needs Review"

    master_names = [m.name for m in master_meds]
    master_map = {m.name.lower(): m for m in master_meds}

    if RAPIDFUZZ_AVAILABLE:
        result = process.extractOne(clean_cand, master_names, scorer=fuzz.ratio)
        if result:
            best_name, best_score, _ = result
            score_pct = float(best_score)
            matched_med = master_map.get(best_name.lower())

            if score_pct >= 80.0 and matched_med:
                return matched_med, score_pct, "Auto-Corrected"
            elif matched_med:
                return matched_med, score_pct, "Needs Review"
    else:
        best_match = None
        best_score = 0.0
        for med in master_meds:
            ratio = difflib.SequenceMatcher(None, clean_cand.lower(), med.name.lower()).ratio() * 100
            if ratio > best_score:
                best_score = ratio
                best_match = med

        if best_score >= 80.0 and best_match:
            return best_match, best_score, "Auto-Corrected"
        elif best_match:
            return best_match, best_score, "Needs Review"

    return None, 0.0, "Needs Review"

@router.post("/upload")
async def upload_prescription_ocr(
    file: UploadFile = File(...), 
    current_user: User = Depends(auth_required)
):
    """
    Upload prescription image/PDF file temporarily.
    Does NOT create any history record in PostgreSQL database until user clicks Save.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file is missing a valid filename.")

    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "pdf"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format '.{ext}'. Allowed formats: JPG, JPEG, PNG, PDF.")

    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{current_user.id}_{timestamp_str}_{re.sub(r'[^a-zA-Z0-9_\.]', '_', file.filename)}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as f:
        f.write(contents)

    mime_type, _ = mimetypes.guess_type(file.filename)
    if not mime_type:
        mime_type = "application/pdf" if ext == "pdf" else f"image/{ext}"

    logger.info(f"[Prescription Recognition] Temporary file saved: filename={file.filename}, size={file_size} bytes, mime={mime_type}, path={safe_filename}")
    return {
        "filename": file.filename,
        "saved_path": safe_filename,
        "file_type": ext.upper(),
        "mime_type": mime_type,
        "file_size_bytes": file_size,
        "message": "File uploaded successfully."
    }

@router.post("/extract")
async def extract_prescription(
    file: Optional[UploadFile] = File(None),
    saved_path: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    """
    Direct Google Gemini Vision API Prescription Analysis & RapidFuzz Master Validation.
    Receives file bytes directly via UploadFile or saved_path parameter.
    Does NOT create any history record in PostgreSQL database until user clicks Save.
    """
    contents = None
    filename = "prescription.jpg"
    mime_type = "image/jpeg"

    if file and file.filename:
        contents = await file.read()
        filename = file.filename
        ext = filename.split(".")[-1].lower()
        mime_type = file.content_type or mimetypes.guess_type(filename)[0] or f"image/{ext}"
        logger.info(f"[Prescription Recognition] Received direct UploadFile: filename={filename}, size={len(contents)} bytes, content_type={mime_type}")
    elif saved_path:
        path = os.path.join(UPLOAD_DIR, saved_path)
        if os.path.exists(path):
            with open(path, "rb") as f:
                contents = f.read()
            filename = saved_path.split("_", 2)[-1] if "_" in saved_path else saved_path
            ext = filename.split(".")[-1].lower()
            mime_type = mimetypes.guess_type(filename)[0] or f"image/{ext}"
            logger.info(f"[Prescription Recognition] Loaded temporary file from disk: path={saved_path}, size={len(contents)} bytes, mime_type={mime_type}")
        else:
            logger.error(f"[Prescription Recognition] File not found on server disk: {path}")
            raise HTTPException(status_code=404, detail=f"Prescription file not found on server at '{saved_path}'.")

    if not contents or len(contents) == 0:
        logger.error("[Prescription Recognition] Uploaded image buffer is empty (0 bytes).")
        raise HTTPException(status_code=400, detail="Uploaded prescription file is empty (0 bytes).")

    # Direct Gemini Vision API Analysis
    logger.info(f"[Prescription Recognition] Initiating Google Gemini Vision API analysis for '{filename}' ({len(contents)} bytes, {mime_type})...")
    gemini_res = await gemini_service.analyze_prescription_direct(contents)

    if not gemini_res.get("success") or not gemini_res.get("medicines"):
        err_detail = gemini_res.get("error") or "No medicines could be confidently extracted."
        logger.error(f"[Prescription Recognition] Gemini Vision recognition failed: {err_detail}")
        raise HTTPException(status_code=422, detail=f"Gemini Vision recognition failed: {err_detail}")

    gemini_medicines = gemini_res["medicines"]
    logger.info(f"[Prescription Recognition] Successfully parsed {len(gemini_medicines)} medicine(s) from Gemini JSON output.")

    master_meds = db.query(MedicineMaster).filter(MedicineMaster.approval_status == "Approved").all()
    validated_medicines = []

    # RapidFuzz Validation & Auto-Correction
    for item in gemini_medicines:
        raw_name = item.get("medicine_name") or item.get("brand_name") or item.get("name", "").strip()
        if not raw_name or any(kw in raw_name.lower() for kw in NOISE_KEYWORDS):
            continue

        matched_med, similarity_score, match_status = fuzzy_match_with_master(raw_name, master_meds)

        final_name = matched_med.name if (matched_med and similarity_score >= 80.0) else raw_name
        matched_master_name = matched_med.name if matched_med else "N/A"
        conf = float(item.get("confidence", 90))

        if conf < 80.0 or match_status == "Needs Review":
            status_text = "Needs Review"
        else:
            status_text = match_status

        validated_medicines.append({
            "name": final_name,
            "medicine_name": final_name,
            "brand_name": item.get("brand_name") or final_name,
            "generic_name": item.get("generic_name") or (matched_med.generic_name if matched_med else None),
            "strength": item.get("strength") or (matched_med.strength + (matched_med.unit or "mg") if matched_med and matched_med.strength else "500 mg"),
            "dosage": item.get("dosage", "1 Tablet"),
            "frequency": item.get("frequency", "Once Daily"),
            "duration": item.get("duration", "7 Days"),
            "timing": item.get("timing", "Morning, Night"),
            "food": item.get("food") or item.get("before_after_food", "After Food"),
            "instructions": item.get("instructions") or item.get("special_instructions", ""),
            "status": status_text,
            "is_matched": bool(matched_med and similarity_score >= 80.0),
            "matched_medicine": matched_master_name,
            "confidence": conf
        })

    logger.info(f"[Prescription Recognition] RapidFuzz validation complete. Returning {len(validated_medicines)} item(s) to review screen.")

    if not validated_medicines:
        raise HTTPException(
            status_code=422,
            detail="No medicines could be confidently extracted from prescription image."
        )

    return {
        "filename": filename,
        "mime_type": mime_type,
        "ocr_status": "Google Gemini Vision Direct",
        "extracted_count": len(validated_medicines),
        "medicines": validated_medicines
    }

@router.post("/save-medicines")
def save_medicines_from_ocr(
    payload: SaveMedicinesBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    """
    Save validated medicines & create EXACTLY ONE scan history record in PostgreSQL database.
    Triggered ONLY when user explicitly clicks "Save Prescription".
    """
    saved_meds = []
    skipped_count = 0

    for item in payload.medicines:
        med_name = item.name.strip()

        if not med_name or len(med_name) < 2 or any(kw in med_name.lower() for kw in NOISE_KEYWORDS):
            skipped_count += 1
            continue

        existing = db.query(Medicine).filter(
            Medicine.user_id == current_user.id,
            Medicine.name.ilike(med_name)
        ).first()

        if existing:
            skipped_count += 1
            continue

        frequency = item.frequency or "Once Daily"
        reminder_times = ["08:00"]
        morn, aft, nigh = True, False, False

        if "Twice" in frequency:
            reminder_times = ["08:00", "20:00"]
            morn, nigh = True, True
        elif "Three" in frequency or "Thrice" in frequency:
            reminder_times = ["08:00", "14:00", "20:00"]
            morn, aft, nigh = True, True, True
        elif "Four" in frequency:
            reminder_times = ["08:00", "12:00", "16:00", "20:00"]
            morn, aft, nigh = True, True, True

        db_med = Medicine(
            user_id=current_user.id,
            name=med_name,
            dosage=f"{item.dosage} ({item.strength})",
            quantity=30,
            frequency=frequency,
            morning=morn,
            afternoon=aft,
            night=nigh,
            food_relation=item.food or "After Food",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            notes=item.instructions or f"Extracted & Confirmed via Google Gemini Vision ({frequency})"
        )
        db.add(db_med)
        db.flush()

        for t in reminder_times:
            hour = int(t.split(":")[0])
            tod = "Morning" if hour < 12 else ("Afternoon" if hour < 17 else "Night")
            s = ReminderSchedule(medicine_id=db_med.id, time_of_day=tod, scheduled_time=t)
            db.add(s)

        saved_meds.append(db_med.name)

    # CREATE EXACTLY ONE OCR HISTORY RECORD UPON CONFIRMED SAVE
    history_record = OCRRecord(
        user_id=current_user.id,
        filename=payload.filename or "prescription.jpg",
        file_type=payload.file_type or "JPG",
        file_size_bytes=payload.file_size_bytes or 0,
        ocr_status="Google Gemini Vision Direct",
        raw_text=json.dumps([item.dict() for item in payload.medicines], indent=2),
        medicines_count=len(saved_meds)
    )
    db.add(history_record)
    db.commit()
    db.refresh(history_record)

    logger.info(f"[Prescription Recognition] Prescription saved successfully! Record ID: {history_record.id}, Medicines: {len(saved_meds)}.")
    return {
        "message": "Prescription saved successfully.",
        "record_id": history_record.id,
        "saved_medicines": saved_meds,
        "skipped_count": skipped_count
    }

@router.get("/history")
def get_ocr_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    """Retrieve user's saved prescription history."""
    records = db.query(OCRRecord).filter(
        OCRRecord.user_id == current_user.id
    ).order_by(OCRRecord.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "file_type": r.file_type,
            "file_size_bytes": r.file_size_bytes,
            "ocr_status": r.ocr_status,
            "medicines_count": r.medicines_count,
            "created_at": r.created_at
        }
        for r in records
    ]

@router.get("/history/{record_id}")
def get_ocr_record_detail(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    """Get single saved prescription detail."""
    record = db.query(OCRRecord).filter(
        OCRRecord.id == record_id,
        OCRRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Prescription Record not found.")

    return {
        "id": record.id,
        "filename": record.filename,
        "file_type": record.file_type,
        "file_size_bytes": record.file_size_bytes,
        "ocr_status": record.ocr_status,
        "raw_text": record.raw_text,
        "medicines_count": record.medicines_count,
        "created_at": record.created_at
    }
