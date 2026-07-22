"""
PillSync SMS Service — Twilio Live Mode
=======================================
This module provides real SMS delivery via Twilio.

- Mock/simulator mode has been completely removed.
- If credentials are missing or invalid, a clear ConfigurationError is raised.
- Phone numbers are validated and normalized to E.164 format.
- Every SMS attempt is logged step-by-step.
- Failed sends are retried up to MAX_RETRIES times with exponential back-off.
- Returns a rich result dict for storage in the database.
"""

import os
import re
import time
import logging
import traceback
from datetime import datetime
from dotenv import load_dotenv

# Load .env from the backend root (one level above this file's package)
load_dotenv()

logger = logging.getLogger("sms_service")

# ── Credentials ──────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID   = os.getenv("TWILIO_ACCOUNT_SID",   "").strip()
TWILIO_AUTH_TOKEN    = os.getenv("TWILIO_AUTH_TOKEN",     "").strip()
TWILIO_PHONE_NUMBER  = os.getenv("TWILIO_PHONE_NUMBER",   "").strip()

MAX_RETRIES = 2          # Total extra attempts after first failure
RETRY_DELAY = 2          # Seconds between retries (doubles each attempt)


# ── Startup credential banner ─────────────────────────────────────────────────
def _print_startup_banner():
    ok = TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER
    sep = "=" * 64
    print(sep)
    print("  PillSync SMS Service — Twilio Configuration")
    print(sep)
    print(f"  ACCOUNT SID  : {'✓ ' + TWILIO_ACCOUNT_SID[:8] + '...' if TWILIO_ACCOUNT_SID else '✗  NOT SET'}")
    print(f"  AUTH TOKEN   : {'✓  configured (hidden)' if TWILIO_AUTH_TOKEN else '✗  NOT SET'}")
    print(f"  FROM NUMBER  : {'✓ ' + TWILIO_PHONE_NUMBER if TWILIO_PHONE_NUMBER else '✗  NOT SET'}")
    print(f"  MODE         : {'✓  LIVE — real SMS will be delivered' if ok else '✗  INCOMPLETE — server will refuse SMS requests'}")
    print(sep)
    logger.info("Twilio credentials loaded — SID=%s, FROM=%s, complete=%s",
                TWILIO_ACCOUNT_SID[:8] + "..." if TWILIO_ACCOUNT_SID else "MISSING",
                TWILIO_PHONE_NUMBER or "MISSING", ok)

_print_startup_banner()


# ── Twilio client initialization ──────────────────────────────────────────────
_twilio_client = None

def _get_client():
    """Return a cached Twilio REST client, initializing it on first call."""
    global _twilio_client
    if _twilio_client is not None:
        return _twilio_client

    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN):
        raise RuntimeError(
            "Twilio credentials are not configured. "
            "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env."
        )
    if not TWILIO_PHONE_NUMBER:
        raise RuntimeError(
            "TWILIO_PHONE_NUMBER is not configured in backend/.env."
        )

    try:
        from twilio.rest import Client
        _twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio REST client initialized successfully.")
        print("[SMS] Twilio REST client initialized successfully.")
        return _twilio_client
    except ImportError:
        raise RuntimeError(
            "The 'twilio' Python package is not installed. "
            "Run: pip install twilio  (or install from requirements.txt)"
        )


# ── Phone number normalizer ───────────────────────────────────────────────────
def normalize_e164(phone: str) -> str:
    """
    Normalize a phone number to E.164 format (+[country_code][number]).

    Accepted inputs:
      "+91 99887 76601"  →  "+919988776601"
      "9703514644"       →  "+919703514644"  (assumes India +91 if no country code)
      "+19566732072"     →  "+19566732072"   (US number, unchanged)

    Raises ValueError if the number cannot be normalized to 10-15 digits.
    """
    if not phone:
        raise ValueError("Phone number is empty.")

    # Strip whitespace, dashes, parentheses
    cleaned = re.sub(r"[\s\-\(\)]", "", phone.strip())

    if cleaned.startswith("+"):
        digits = cleaned[1:]
        if not digits.isdigit():
            raise ValueError(f"Phone number '{phone}' contains non-digit characters after '+'.")
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError(f"Phone number '{phone}' has {len(digits)} digits (expected 10–15).")
        return "+" + digits
    else:
        if not cleaned.isdigit():
            raise ValueError(f"Phone number '{phone}' contains non-digit characters.")
        if len(cleaned) == 10:
            # Assume Indian mobile number (no country code)
            return "+91" + cleaned
        elif 11 <= len(cleaned) <= 15:
            return "+" + cleaned
        else:
            raise ValueError(
                f"Phone number '{phone}' has {len(cleaned)} digits. "
                "Provide number in E.164 format e.g. +919988776601"
            )


# ── Core SMS dispatcher ───────────────────────────────────────────────────────
def send_sms(to_phone: str, body: str) -> dict:
    """
    Send a real SMS via Twilio.

    Args:
        to_phone: Recipient phone number (any reasonable format — will be normalized).
        body:     SMS message body text.

    Returns:
        dict with keys:
          status          "success" | "failed"
          sid             Twilio Message SID (e.g. "SM...")
          provider        "Twilio"
          delivery_status Twilio message status (e.g. "queued", "sent", "delivered")
          to              Normalized E.164 recipient number
          error           Error message string (only on failure)

    Raises:
        RuntimeError if Twilio credentials are not configured.
    """
    # ── Step 1: Validate & normalize phone number ─────────────────────────────
    try:
        e164_phone = normalize_e164(to_phone)
    except ValueError as ve:
        msg = f"Invalid phone number '{to_phone}': {ve}"
        logger.error("[SMS] %s", msg)
        print(f"[SMS] ERROR: {msg}")
        return {"status": "failed", "error": msg, "provider": "Twilio", "to": to_phone}

    logger.info("[SMS] ── New dispatch request ────────────────────────────")
    logger.info("[SMS] Recipient : %s (raw: %s)", e164_phone, to_phone)
    logger.info("[SMS] From      : %s", TWILIO_PHONE_NUMBER)
    logger.info("[SMS] Body      : %s", body[:120] + ("..." if len(body) > 120 else ""))
    print(f"[SMS] Sending to {e164_phone} from {TWILIO_PHONE_NUMBER}")
    print(f"[SMS] Message   : {body[:100]}{'...' if len(body) > 100 else ''}")

    # ── Step 2: Get Twilio client (raises RuntimeError if not configured) ─────
    client = _get_client()

    # ── Step 3: Send with retry logic ────────────────────────────────────────
    last_error = None
    delay = RETRY_DELAY

    for attempt in range(1, MAX_RETRIES + 2):  # attempts: 1, 2, 3
        try:
            logger.info("[SMS] Attempt %d/%d — calling Twilio API...", attempt, MAX_RETRIES + 1)
            print(f"[SMS] Attempt {attempt}/{MAX_RETRIES + 1} — calling Twilio API...")

            message = client.messages.create(
                body=body,
                from_=TWILIO_PHONE_NUMBER,
                to=e164_phone,
            )

            logger.info("[SMS] ✓ SUCCESS")
            logger.info("[SMS]   SID     : %s", message.sid)
            logger.info("[SMS]   Status  : %s", message.status)
            logger.info("[SMS]   To      : %s", message.to)
            logger.info("[SMS]   From    : %s", message.from_)
            logger.info("[SMS]   Sent at : %s", datetime.utcnow().isoformat())
            print(f"[SMS] ✓ SUCCESS — SID={message.sid}, Status={message.status}, To={message.to}")

            return {
                "status": "success",
                "sid": message.sid,
                "provider": "Twilio",
                "delivery_status": message.status or "queued",
                "to": e164_phone,
            }

        except Exception as err:
            last_error = err
            logger.error("[SMS] ✗ Attempt %d FAILED: %s", attempt, err)
            print(f"[SMS] ✗ Attempt {attempt} FAILED: {err}")
            print(traceback.format_exc())

            if attempt <= MAX_RETRIES:
                logger.info("[SMS] Retrying in %ds...", delay)
                print(f"[SMS] Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2  # Exponential back-off

    # All attempts exhausted
    err_msg = f"All {MAX_RETRIES + 1} Twilio attempts failed. Last error: {last_error}"
    logger.error("[SMS] %s", err_msg)
    print(f"[SMS] ERROR: {err_msg}")
    return {
        "status": "failed",
        "error": str(last_error),
        "provider": "Twilio",
        "delivery_status": "failed",
        "to": e164_phone,
    }


# ── Convenience wrappers ──────────────────────────────────────────────────────
def send_reminder(
    patient_name: str,
    medicine_name: str,
    dosage: str,
    time_of_day: str,
    phone: str,
) -> dict:
    """Send a medicine dosage reminder SMS to the patient."""
    logger.info(
        "[SMS] Reminder → patient=%s, medicine=%s, dosage=%s, time=%s, phone=%s",
        patient_name, medicine_name, dosage, time_of_day, phone,
    )
    body = (
        f"Hi {patient_name}, this is PillSync.\n"
        f"Time to take your medication:\n"
        f"💊 {medicine_name} — {dosage}\n"
        f"🕒 {time_of_day}\n"
        f"Please log Taken / Missed on the dashboard."
    )
    return send_sms(phone, body)


def send_refill_alert(
    patient_name: str,
    medicine_name: str,
    remaining_qty: int,
    phone: str,
) -> dict:
    """Send a low-stock refill alert SMS to the patient."""
    logger.info(
        "[SMS] Refill alert → patient=%s, medicine=%s, qty=%d, phone=%s",
        patient_name, medicine_name, remaining_qty, phone,
    )
    body = (
        f"⚠ PillSync Alert — {patient_name}\n"
        f"Your stock of {medicine_name} is running low.\n"
        f"📉 Remaining: {remaining_qty} pills\n"
        f"Please request a refill soon."
    )
    return send_sms(phone, body)
