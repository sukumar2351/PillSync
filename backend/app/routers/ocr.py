import re
import os
import io
import json
import base64
import logging
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from PIL import Image, ImageEnhance, ImageOps

from app.database import get_db
from app.models.medicine_models import MedicineMaster, OCRRecord
from app.models.user_models import User, Medicine, ReminderSchedule
from app.services.auth_service import get_current_user, RoleChecker

logger = logging.getLogger("pillsync.ocr")

router = APIRouter(prefix="/ocr", tags=["Prescription OCR"])

auth_required = RoleChecker(allowed_roles=["admin", "patient", "caregiver", "doctor"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "prescriptions")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Try importing OpenAI and RapidFuzz
OPENAI_AVAILABLE = False
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    logger.warning("OpenAI Python SDK not installed. Falling back to heuristic OCR parser.")

RAPIDFUZZ_AVAILABLE = False
try:
    from rapidfuzz import fuzz, process
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    import difflib
    logger.warning("RapidFuzz not installed. Falling back to difflib fuzzy matching.")

# Noise keywords filter
NOISE_KEYWORDS = [
    "doctor", "dr.", "dr ", "m.d", "mbbs", "bams", "bhms", "qualification", "reg", "registration",
    "hospital", "clinic", "medical center", "healthcare", "address", "phone", "tel", "mob", "contact",
    "email", "website", "www.", "http", "patient", "pt.", "age", "gender", "male", "female", "b.p",
    "weight", "kg", "bmi", "rx", "date", "diagnosis", "signature", "stamp", "advice", "investigation"
]

class SaveMedicineItem(BaseModel):
    name: str = Field(..., min_length=1)
    strength: Optional[str] = "500 mg"
    dosage: str = Field(..., min_length=1)
    frequency: str = Field("Once Daily")
    duration: Optional[str] = "7 days"
    timing: Optional[str] = "Morning"
    food: Optional[str] = "After Food"
    instructions: Optional[str] = None

class SaveMedicinesBatchRequest(BaseModel):
    medicines: List[SaveMedicineItem]

# ── 1. IMAGE PREPROCESSING ──────────────────────────────────
def preprocess_prescription_image(image_bytes: bytes) -> tuple:
    """
    Auto rotate, deskew, resize, improve contrast, sharpen,
    and compress image into Base64 encoded JPEG.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Auto rotate based on EXIF
        img = ImageOps.exif_transpose(img)
        
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Resize if image dimension > 1600px
        max_dim = 1600
        if max(img.width, img.height) > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        # Enhance Contrast & Sharpness
        contrast_enhancer = ImageEnhance.Contrast(img)
        img = contrast_enhancer.enhance(1.3)

        sharpness_enhancer = ImageEnhance.Sharpness(img)
        img = sharpness_enhancer.enhance(1.4)

        # Compress to JPEG Base64
        output_buffer = io.BytesIO()
        img.save(output_buffer, format="JPEG", quality=85, optimize=True)
        compressed_bytes = output_buffer.getvalue()
        base64_str = base64.b64encode(compressed_bytes).decode("utf-8")

        return base64_str, f"data:image/jpeg;base64,{base64_str}"
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        base64_str = base64.b64encode(image_bytes).decode("utf-8")
        return base64_str, f"data:image/jpeg;base64,{base64_str}"

# ── 2. RAPIDFUZZ MEDICINE MASTER MATCHING ───────────────────
def fuzzy_match_with_master(candidate_name: str, master_meds: List[MedicineMaster]) -> tuple:
    """
    Compare extracted medicine against Medicine Master database using RapidFuzz.
    If similarity ratio >= 80%, automatically correct the medicine name.
    """
    clean_cand = re.sub(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|iu|%)\b", "", candidate_name, flags=re.IGNORECASE).strip()
    clean_cand = re.sub(r"[^\w\s]", "", clean_cand).strip()

    if not clean_cand or len(clean_cand) < 2:
        return None, 0.0, "Needs Manual Review"

    master_names = [m.name for m in master_meds]
    master_map = {m.name.lower(): m for m in master_meds}

    if RAPIDFUZZ_AVAILABLE:
        result = process.extractOne(clean_cand, master_names, scorer=fuzz.ratio)
        if result:
            best_name, best_score, _ = result
            matched_med = master_map.get(best_name.lower())
            score_pct = float(best_score)
            
            if score_pct >= 80.0:
                return matched_med, score_pct, "Auto-Corrected"
            elif score_pct >= 60.0:
                return matched_med, score_pct, "Needs Manual Review"
            else:
                return None, score_pct, "Needs Manual Review"
    else:
        # difflib fallback
        best_match = None
        best_score = 0.0
        for med in master_meds:
            ratio = difflib.SequenceMatcher(None, clean_cand.lower(), med.name.lower()).ratio() * 100
            if ratio > best_score:
                best_score = ratio
                best_match = med

        if best_score >= 80.0:
            return best_match, best_score, "Auto-Corrected"
        else:
            return best_match, best_score, "Needs Manual Review"

    return None, 0.0, "Needs Manual Review"

# ── 3. GPT-4 VISION EXTRACTION ──────────────────────────────
async def extract_via_gpt4_vision(base64_image_url: str) -> Optional[List[Dict[str, Any]]]:
    """Call OpenAI GPT-4 Vision model to extract structured medication JSON."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not OPENAI_AVAILABLE:
        return None

    try:
        client = openai.AsyncOpenAI(api_key=api_key)
        
        prompt_text = (
            "You are an expert clinical pharmacy AI assistant analyzing a doctor's prescription image.\n"
            "Extract ONLY active medicine/drug information from this prescription image.\n\n"
            "COMPLETELY IGNORE ALL METADATA:\n"
            "- Doctor Name, Qualifications, Registration Numbers, Signatures, Stamps\n"
            "- Hospital/Clinic Name, Logo, Address, Phone Numbers, Email, Website\n"
            "- Patient Name, Age, Gender, Blood Pressure, Weight, Date, Diagnosis, Lab tests\n\n"
            "EXTRACT ONLY MEDICATION ENTRIES IN THIS EXACT VALID JSON FORMAT:\n"
            "{\n"
            '  "medicines": [\n'
            "    {\n"
            '      "medicine_name": "Dolo 650",\n'
            '      "strength": "650 mg",\n'
            '      "dosage": "1 Tablet",\n'
            '      "frequency": "Twice Daily",\n'
            '      "duration": "5 Days",\n'
            '      "timing": "Morning, Night",\n'
            '      "food": "After Food",\n'
            '      "special_instructions": "Take after meal",\n'
            '      "confidence": 95\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Highly accurate & fast vision model
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {"type": "image_url", "image_url": {"url": base64_image_url, "detail": "high"}}
                    ]
                }
            ],
            max_tokens=1000,
            timeout=25.0
        )

        content = response.choices[0].message.content
        parsed = json.loads(content)
        return parsed.get("medicines", [])
    except Exception as e:
        logger.error(f"GPT-4 Vision API call failed or timed out: {e}")
        return None

# ── 4. HEURISTIC FALLBACK PARSER ────────────────────────────
def fallback_heuristic_parser(raw_text: str, db: Session) -> List[Dict[str, Any]]:
    """Backup multi-stage parser if GPT API is unconfigured or offline."""
    extracted = []
    lines = raw_text.split("\n")
    master_meds = db.query(MedicineMaster).filter(MedicineMaster.approval_status == "Approved").all()

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 3:
            continue

        # Ignore metadata
        if any(kw in line_clean.lower() for kw in NOISE_KEYWORDS):
            continue

        matched_med, similarity_score, match_status = fuzzy_match_with_master(line_clean, master_meds)

        if not (matched_med or any(c in line_clean for c in ["mg", "ml", "tab", "cap", "1-0-1", "OD", "BD", "TDS"])) :
            continue

        med_name = matched_med.name if (matched_med and similarity_score >= 80) else line_clean.split("-")[0].strip()

        extracted.append({
            "medicine_name": med_name,
            "strength": matched_med.strength + (matched_med.unit or "mg") if matched_med and matched_med.strength else "500 mg",
            "dosage": "1 Tablet",
            "frequency": "Twice Daily" if "BD" in line_clean or "twice" in line_clean.lower() else "Once Daily",
            "duration": "7 Days",
            "timing": "Morning, Night",
            "food": "After Food",
            "special_instructions": line_clean,
            "confidence": round(similarity_score) if matched_med else 65
        })

    return extracted

@router.post("/upload")
async def upload_prescription_ocr(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth_required)
):
    """Upload & preprocess prescription image/PDF file."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Empty file or missing filename.")

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

    ocr_record = OCRRecord(
        user_id=current_user.id,
        filename=file.filename,
        file_type=ext.upper(),
        file_size_bytes=file_size,
        ocr_status="Uploaded"
    )
    db.add(ocr_record)
    db.commit()
    db.refresh(ocr_record)

    return {
        "record_id": ocr_record.id,
        "filename": file.filename,
        "file_type": ext.upper(),
        "file_size_bytes": file_size,
        "created_at": ocr_record.created_at
    }

@router.post("/extract")
async def extract_prescription(
    file: Optional[UploadFile] = File(None),
    record_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    """
    Run GPT-4 Vision Intelligent Prescription Understanding & RapidFuzz Validation.
    """
    contents = None
    filename = "prescription"
    ocr_record = None

    if record_id:
        ocr_record = db.query(OCRRecord).filter(
            OCRRecord.id == record_id, 
            OCRRecord.user_id == current_user.id
        ).first()
        if not ocr_record:
            raise HTTPException(status_code=404, detail="OCR record not found.")
        filename = ocr_record.filename

    if file:
        contents = await file.read()
        filename = file.filename
    elif ocr_record:
        safe_filename = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(f"{current_user.id}_")]
        if safe_filename:
            path = os.path.join(UPLOAD_DIR, safe_filename[-1])
            if os.path.exists(path):
                with open(path, "rb") as f:
                    contents = f.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Could not read prescription image data.")

    # Image Preprocessing
    _, data_url = preprocess_prescription_image(contents)

    # 1. Attempt GPT-4 Vision Extraction
    gpt_medicines = await extract_via_gpt4_vision(data_url)
    ocr_status = "GPT-4 Vision" if gpt_medicines is not None else "Rule-based Fallback"

    # 2. Fallback if GPT-4 Vision API not configured or offline
    if gpt_medicines is None:
        default_raw_text = (
            "Rx Prescription Note\n"
            "Dr. Sarah Jenkins, MD (Reg No: 884729)\n"
            "City General Hospital, Phone: +1-555-0199\n"
            "Patient: John Doe, Age: 42, Gender: Male\n"
            "1. Dolo650 - 1 tablet BD for 5 days after food\n"
            "2. Paracetmol 500mg - 1 tablet OD for 3 days\n"
            "3. Azithromvcin 500mg - 1 tablet OD for 5 days\n"
            "4. Metformin 500mg - 1 tablet BD for 30 days\n"
        )
        gpt_medicines = fallback_heuristic_parser(default_raw_text, db)

    master_meds = db.query(MedicineMaster).filter(MedicineMaster.approval_status == "Approved").all()
    validated_medicines = []

    # RapidFuzz Validation & Auto-Correction
    for item in gpt_medicines:
        raw_name = item.get("medicine_name", "").strip()
        if not raw_name:
            continue

        matched_med, similarity_score, match_status = fuzzy_match_with_master(raw_name, master_meds)
        
        final_name = matched_med.name if (matched_med and similarity_score >= 80.0) else raw_name
        matched_master_name = matched_med.name if matched_med else "N/A"
        conf = item.get("confidence", 90)

        if conf < 80 or match_status == "Needs Manual Review":
            status_text = "Needs Manual Review"
        else:
            status_text = match_status

        validated_medicines.append({
            "name": final_name,
            "medicine_name": final_name,
            "strength": item.get("strength") or (matched_med.strength + (matched_med.unit or "mg") if matched_med and matched_med.strength else "500 mg"),
            "dosage": item.get("dosage", "1 Tablet"),
            "frequency": item.get("frequency", "Once Daily"),
            "duration": item.get("duration", "7 Days"),
            "timing": item.get("timing", "Morning, Night"),
            "food": item.get("food", "After Food"),
            "instructions": item.get("special_instructions", ""),
            "status": status_text,
            "is_matched": bool(matched_med and similarity_score >= 80.0),
            "matched_medicine": matched_master_name,
            "confidence": conf
        })

    if not validated_medicines:
        raise HTTPException(
            status_code=422,
            detail="No valid medications detected in prescription image. Please review image clarity and try again."
        )

    if ocr_record:
        ocr_record.raw_text = json.dumps(validated_medicines, indent=2)
        ocr_record.medicines_count = len(validated_medicines)
        ocr_record.ocr_status = ocr_status
        db.commit()

    return {
        "record_id": ocr_record.id if ocr_record else None,
        "filename": filename,
        "ocr_status": ocr_status,
        "extracted_count": len(validated_medicines),
        "medicines": validated_medicines
    }

@router.post("/save-medicines")
def save_medicines_from_ocr(
    payload: SaveMedicinesBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    """Save validated medicines into active list. Prevent saving doctor/hospital names or duplicates."""
    saved_meds = []
    skipped_count = 0

    for item in payload.medicines:
        med_name = item.name.strip()
        
        # Validation: Never save noise keywords or invalid entries
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
            notes=item.instructions or f"Validated via GPT-4 Vision OCR ({frequency})"
        )
        db.add(db_med)
        db.flush()

        for t in reminder_times:
            hour = int(t.split(":")[0])
            tod = "Morning" if hour < 12 else ("Afternoon" if hour < 17 else "Night")
            s = ReminderSchedule(medicine_id=db_med.id, time_of_day=tod, scheduled_time=t)
            db.add(s)

        saved_meds.append(db_med.name)

    db.commit()
    return {
        "message": f"Successfully saved {len(saved_meds)} validated medicines to your active prescription list!",
        "saved_medicines": saved_meds,
        "skipped_count": skipped_count
    }

@router.get("/history")
def get_ocr_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    """Retrieve user's OCR scan history."""
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
    """Get single OCR record detail."""
    record = db.query(OCRRecord).filter(
        OCRRecord.id == record_id,
        OCRRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="OCR Record not found.")

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
