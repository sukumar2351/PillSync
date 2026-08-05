import os
import json
import logging
from google import genai
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)

# Simple in-memory cache for validation results
_validation_cache = {}

class MedicineValidationResult(BaseModel):
    is_valid: bool
    normalized_name: Optional[str] = None
    generic_name: Optional[str] = None
    medicine_type: Optional[str] = None
    confidence: Optional[float] = None
    reason: str

def validate_medicine_with_gemini(medicine_name: str) -> MedicineValidationResult:
    """
    Validate a medicine name using Gemini AI.
    Returns a MedicineValidationResult.
    """
    name_key = medicine_name.strip().lower()
    
    # Check cache first
    if name_key in _validation_cache:
        logger.info(f"[Gemini Validation] Cache hit for '{medicine_name}'")
        return _validation_cache[name_key]
        
    api_key = os.environ.get("MEDICINE_VALIDATION_GEMINI_API_KEY")
    if not api_key:
        logger.error("[Gemini Validation] MEDICINE_VALIDATION_GEMINI_API_KEY is not set.")
        return MedicineValidationResult(
            is_valid=False,
            reason="Validation service configuration error (missing API key). Please contact support."
        )
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert pharmaceutical validation AI.
    Validate if the following text is a real, recognized medicine name: "{medicine_name}"
    
    You MUST return ONLY a raw valid JSON object. Do not include markdown formatting like ```json.
    
    If it is a valid medicine (or a misspelling of a valid medicine):
    {{
        "is_valid": true,
        "normalized_name": "Correctly spelled brand or generic name",
        "generic_name": "The active ingredient/generic name",
        "medicine_type": "Tablet/Syrup/Capsule/etc",
        "confidence": 0.99,
        "reason": "Recognized medicine."
    }}
    
    If it is NOT a valid medicine (e.g., random characters, non-medical terms):
    {{
        "is_valid": false,
        "reason": "The entered text is not a recognized medicine."
    }}
    """
    
    try:
        logger.info(f"[Gemini Validation] Calling Gemini API for '{medicine_name}'...")
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
        )
        
        response_text = response.text.strip()
        # Remove potential markdown formatting if Gemini still included it
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        data = json.loads(response_text.strip())
        
        result = MedicineValidationResult(**data)
        
        # Cache successful validation
        if result.is_valid:
            _validation_cache[name_key] = result
            
        logger.info(f"[Gemini Validation] Result for '{medicine_name}': {result.is_valid} (Confidence: {result.confidence})")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"[Gemini Validation] Failed to parse JSON response: {response.text}")
        raise Exception("Failed to parse Gemini response.")
    except Exception as e:
        logger.exception(f"[Gemini Validation] API Error: {e}")
        raise Exception(f"Gemini validation failed: {str(e)}")
