import os
import io
import json
import logging
import numpy as np
import cv2
from PIL import Image, ImageOps
from dotenv import load_dotenv

# Load environment variables securely from .env
load_dotenv()

logger = logging.getLogger("pillsync.gemini_service")

# Import official Google Gen AI SDK
GENAI_SDK_AVAILABLE = False
try:
    from google import genai
    GENAI_SDK_AVAILABLE = True
except ImportError:
    logger.warning("google-genai SDK not installed.")

def preprocess_prescription_image_opencv(image_bytes: bytes) -> tuple:
    """
    OpenCV Preprocessing Pipeline (OpenCV only):
    1. Decode image bytes to NumPy array.
    2. Auto-rotate / EXIF deskew.
    3. Remove background noise using Gaussian Blur & Denoising.
    4. Improve contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
    5. Resize image if dimension > 1600px maintaining aspect ratio.
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img_cv = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img_cv is None:
            pil_fallback = Image.open(io.BytesIO(image_bytes))
            pil_fallback = ImageOps.exif_transpose(pil_fallback)
            img_cv = cv2.cvtColor(np.array(pil_fallback), cv2.COLOR_RGB2BGR)

        # 1. Resize if max dimension > 1600px
        h, w = img_cv.shape[:2]
        max_dim = 1600
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            new_w, new_h = int(w * scale), int(h * scale)
            img_cv = cv2.resize(img_cv, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # 2. Contrast enhancement via CLAHE
        lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)

        limg = cv2.merge((cl, a_channel, b_channel))
        enhanced_cv = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        # 3. Denoising
        denoised_cv = cv2.fastNlMeansDenoisingColored(enhanced_cv, None, 5, 5, 7, 21)

        # Convert OpenCV BGR image to RGB PIL Image
        img_rgb = cv2.cvtColor(denoised_cv, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)

        return pil_img, cv2.imencode(".jpg", denoised_cv)[1].tobytes()

    except Exception as e:
        logger.error(f"[OpenCV Preprocessing] Error: {e}. Falling back to basic ImageOps.")
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img = ImageOps.exif_transpose(pil_img)
        return pil_img, image_bytes

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

    async def analyze_prescription_direct(self, image_bytes: bytes) -> dict:
        """
        Directly send preprocessed prescription image to Google Gemini Vision API.
        No traditional OCR engine is used.
        """
        # OpenCV Preprocessing
        pil_img, _ = preprocess_prescription_image_opencv(image_bytes)

        if not self.is_configured():
            logger.warning("[GeminiService] GOOGLE_API_KEY not configured or client uninitialized.")
            return {"success": False, "medicines": [], "error": "API key missing or client uninitialized"}

        prompt_text = (
            "You are an experienced clinical prescription analysis assistant.\n\n"
            "Analyze this prescription image directly.\n\n"
            "Do NOT perform generic OCR.\n\n"
            "Understand the medical prescription like a pharmacist.\n\n"
            "Ignore completely:\n"
            "• Doctor Name\n"
            "• Hospital Name\n"
            "• Registration Number\n"
            "• Address\n"
            "• Phone Number\n"
            "• Patient Name\n"
            "• Patient Age\n"
            "• Gender\n"
            "• Signature\n"
            "• Stamp\n"
            "• Logos\n\n"
            "Extract ONLY medicines.\n\n"
            "For every medicine return:\n"
            "- Medicine Name\n"
            "- Generic Name (if available)\n"
            "- Strength\n"
            "- Dosage\n"
            "- Frequency\n"
            "- Duration\n"
            "- Before Food / After Food\n"
            "- Timing\n"
            "- Instructions\n"
            "- Confidence Score\n\n"
            "Return ONLY valid JSON.\n\n"
            "Never return explanations.\n\n"
            "Never guess medicine names.\n\n"
            "If uncertain, mark confidence below 70."
        )

        # Try gemini-2.0-flash first, then gemini-1.5-flash
        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash"]
        last_err = None

        for model_name in models_to_try:
            try:
                logger.info(f"[GeminiService] Sending image to model {model_name}...")
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=[pil_img, prompt_text]
                )

                txt = response.text.strip()
                if txt.startswith("```json"):
                    txt = txt[7:]
                if txt.startswith("```"):
                    txt = txt[3:]
                if txt.endswith("```"):
                    txt = txt[:-3]

                parsed_data = json.loads(txt.strip())
                medicines_list = parsed_data.get("medicines", [])
                if not isinstance(medicines_list, list) and isinstance(parsed_data, list):
                    medicines_list = parsed_data

                return {
                    "success": True,
                    "model_used": model_name,
                    "medicines": medicines_list,
                    "raw_response": txt
                }

            except Exception as e:
                logger.warning(f"[GeminiService] Model {model_name} call error: {e}")
                last_err = e

        return {
            "success": False,
            "medicines": [],
            "error": str(last_err)
        }

gemini_service = GeminiPrescriptionService()
