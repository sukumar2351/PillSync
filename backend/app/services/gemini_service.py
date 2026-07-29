import os
import io
import json
import logging
from PIL import Image
from dotenv import load_dotenv

# Load environment variables securely from .env
load_dotenv()

logger = logging.getLogger("pillsync.gemini_service")

# Import official Google Gen AI SDK
try:
    from google import genai
    GENAI_SDK_AVAILABLE = True
except ImportError:
    GENAI_SDK_AVAILABLE = False
    logger.warning("google-genai SDK not installed. Gemini service falling back to secondary providers.")

class GeminiPrescriptionService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key and GENAI_SDK_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("[GeminiService] Google GenAI client initialized successfully.")
            except Exception as e:
                logger.error(f"[GeminiService] Failed to initialize Google GenAI client: {e}")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client)

    async def process_prescription_image(self, image_bytes: bytes) -> dict:
        """
        Send uploaded prescription image bytes to Google Gemini API
        and return structured JSON containing medicine info.
        """
        if not self.is_configured():
            logger.warning("[GeminiService] GOOGLE_API_KEY not configured or client initialization failed.")
            return {"success": False, "medicines": [], "error": "API key missing or client uninitialized"}

        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            
            prompt_text = (
                "You are an expert clinical pharmacist AI assistant analyzing a doctor's medical prescription image.\n"
                "Extract ONLY active medicine/drug information from this prescription image.\n\n"
                "IGNORE COMPLETELY:\n"
                "- Doctor Name, Qualification, Registration Number, Signature, Stamp\n"
                "- Hospital Name, Logo, Address, Phone Number, Email, Website\n"
                "- Patient Name, Age, Gender, Blood Pressure, Weight, Date, Diagnosis, General Notes\n\n"
                "EXTRACT ONLY MEDICATION ENTRIES IN THIS EXACT VALID JSON FORMAT:\n"
                "{\n"
                '  "medicines": [\n'
                "    {\n"
                '      "medicine_name": "Dolo 650",\n'
                '      "strength": "650 mg",\n'
                '      "dosage": "1 Tablet",\n'
                '      "frequency": "Twice Daily",\n'
                '      "duration": "5 Days",\n'
                '      "instructions": "Take after meal"\n'
                "    }\n"
                "  ]\n"
                "}"
            )

            # Generate content using Gemini Vision model
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[pil_img, prompt_text]
            )

            txt = response.text.strip()
            if txt.startswith("```json"):
                txt = txt[7:]
            if txt.endswith("```"):
                txt = txt[:-3]

            parsed_data = json.loads(txt.strip())
            return {
                "success": True,
                "medicines": parsed_data.get("medicines", []),
                "raw_response": txt
            }

        except Exception as e:
            logger.error(f"[GeminiService] Gemini vision recognition error: {e}")
            return {
                "success": False,
                "medicines": [],
                "error": str(e)
            }

gemini_service = GeminiPrescriptionService()
