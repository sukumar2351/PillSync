"""
PillSync Email Service — Gmail SMTP App Password Mode
======================================================
This module provides real email delivery using standard SMTP.
It replaces the old SMS reminder engine.
"""

import os
import time
import logging
import smtplib
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

# Load .env
load_dotenv()

logger = logging.getLogger("email_service")

# ── Credentials ──────────────────────────────────────────────────────────────
SMTP_HOST      = os.getenv("SMTP_SERVER",     "smtp.gmail.com").strip()
SMTP_PORT_RAW  = os.getenv("SMTP_PORT",        "587").strip()
SMTP_PORT      = int(SMTP_PORT_RAW) if SMTP_PORT_RAW.isdigit() else 587
SMTP_USERNAME  = os.getenv("EMAIL_ADDRESS",   "").strip()
SMTP_PASSWORD  = os.getenv("EMAIL_APP_PASSWORD", "").strip()
EMAIL_FROM     = os.getenv("EMAIL_ADDRESS",   SMTP_USERNAME).strip()

MAX_RETRIES = 2
RETRY_DELAY = 2

def _print_startup_banner():
    ok = SMTP_HOST and SMTP_PORT and SMTP_USERNAME and SMTP_PASSWORD
    sep = "=" * 64
    print(sep)
    print("  PillSync Email Service — Gmail SMTP Configuration")
    print(sep)
    print(f"  SMTP HOST    : {SMTP_HOST}")
    print(f"  SMTP PORT    : {SMTP_PORT}")
    print(f"  EMAIL_ADDRESS: {'✓ ' + SMTP_USERNAME if SMTP_USERNAME else '✗  NOT SET'}")
    print(f"  EMAIL_APP_PASSWORD: {'✓  configured (hidden)' if SMTP_PASSWORD else '✗  NOT SET'}")
    print(f"  EMAIL FROM   : {'✓ ' + EMAIL_FROM if EMAIL_FROM else '✗  NOT SET'}")
    print(f"  MODE         : {'✓  LIVE — SMTP email reminders enabled' if ok else '✗  INCOMPLETE'}")
    print(sep)
    logger.info("SMTP configuration loaded — HOST=%s, USER=%s, complete=%s", SMTP_HOST, SMTP_USERNAME or "MISSING", ok)

_print_startup_banner()

def send_email(to_email: str, subject: str, html_body: str, plain_body: str = "") -> dict:
    """
    Core SMTP mail dispatcher with retry and exponential backoff logic.
    """
    if not SMTP_USERNAME:
        raise RuntimeError("Missing EMAIL_ADDRESS configuration in .env file.")
    if not SMTP_PASSWORD:
        raise RuntimeError("Missing EMAIL_APP_PASSWORD configuration in .env file.")

    logger.info("[Email] ── New dispatch request ────────────────────────────")
    logger.info("[Email] Recipient : %s", to_email)
    logger.info("[Email] Subject   : %s", subject)
    print(f"[Email] Sending mail to {to_email} with subject: {subject}")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email

    if plain_body:
        msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    last_error = None
    delay = RETRY_DELAY

    for attempt in range(1, MAX_RETRIES + 2):
        try:
            logger.info("[Email] Attempt %d/%d — connecting to SMTP...", attempt, MAX_RETRIES + 1)
            print(f"[Email] Attempt {attempt}/{MAX_RETRIES + 1} — connecting to SMTP...")

            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(EMAIL_FROM, to_email, msg.as_string())
            server.quit()

            logger.info("[Email] ✓ SUCCESS")
            print(f"[Email] ✓ SUCCESS — Sent to {to_email}")

            return {
                "status": "success",
                "provider": "Gmail-SMTP",
                "delivery_status": "sent",
                "to": to_email,
                "sent_at": datetime.utcnow().isoformat()
            }

        except Exception as err:
            last_error = err
            logger.error("[Email] ✗ Attempt %d FAILED: %s", attempt, err)
            print(f"[Email] ✗ Attempt {attempt} FAILED: {err}")
            print(traceback.format_exc())

            if attempt <= MAX_RETRIES:
                logger.info("[Email] Retrying in %ds...", delay)
                print(f"[Email] Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2

    err_msg = f"All {MAX_RETRIES + 1} SMTP attempts failed. Last error: {last_error}"
    logger.error("[Email] %s", err_msg)
    print(f"[Email] ERROR: {err_msg}")
    return {
        "status": "failed",
        "error": str(last_error),
        "provider": "Gmail-SMTP",
        "delivery_status": "failed",
        "to": to_email,
    }

# ── Convenience Wrappers ──────────────────────────────────────────────────────

def send_medicine_reminder(patient_name: str, medicine_name: str, dosage: str, time_of_day: str, to_email: str) -> dict:
    """Send a medicine dosage reminder email."""
    subject = f"PillSync Medication Reminder: {medicine_name}"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; margin-top: 0;">Medication Reminder</h2>
          <p>Hi {patient_name},</p>
          <p>This is a reminder from PillSync that it is time to take your medication:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; font-size: 1.1em;"><strong>💊 {medicine_name}</strong> &mdash; {dosage}</p>
            <p style="margin: 5px 0 0; color: #64748b;">🕒 Scheduled slot: {time_of_day.upper()}</p>
          </div>
          <p>Please remember to update your status (Taken/Missed) on your PillSync Dashboard.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #94a3b8; text-align: center; margin: 0;">&copy; 2026 PillSync Portal. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    plain = f"Hi {patient_name},\n\nTime to take your medication: {medicine_name} ({dosage}) - {time_of_day.upper()}.\nPlease record your adherence on the PillSync Dashboard."
    return send_email(to_email, subject, html, plain)

def send_refill_notification(patient_name: str, medicine_name: str, remaining_qty: int, to_email: str) -> dict:
    """Send a low-stock refill notification email."""
    subject = f"PillSync Low Stock Alert: {medicine_name}"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #dc2626; margin-top: 0;">Low Stock Alert</h2>
          <p>Hi {patient_name},</p>
          <p>Your medication supply is running low:</p>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; font-size: 1.1em; color: #991b1b;"><strong>{medicine_name}</strong></p>
            <p style="margin: 5px 0 0; color: #b91c1c;">📉 Remaining stock: {remaining_qty} pills/doses</p>
          </div>
          <p>Please secure a refill or contact your physician to avoid missing scheduled doses.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #94a3b8; text-align: center; margin: 0;">&copy; 2026 PillSync Portal. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    plain = f"Low Stock Alert: Your supply of {medicine_name} is running low ({remaining_qty} doses left). Please request a refill."
    return send_email(to_email, subject, html, plain)

def send_missed_dose_notification(patient_name: str, medicine_name: str, time_of_day: str, to_email: str) -> dict:
    """Send a notification when a dose is missed."""
    subject = f"PillSync Missed Medication Alert: {medicine_name}"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #d97706; margin-top: 0;">Missed Dose Alert</h2>
          <p>Hi {patient_name},</p>
          <p>Our records show that you did not log your scheduled medication as taken:</p>
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #d97706;">
            <p style="margin: 0; font-size: 1.1em; color: #92400e;"><strong>{medicine_name}</strong></p>
            <p style="margin: 5px 0 0; color: #b45309;">🕒 Missed slot: {time_of_day.upper()}</p>
          </div>
          <p>If you have already taken it, please log it on the dashboard to ensure accurate compliance history logs.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #94a3b8; text-align: center; margin: 0;">&copy; 2026 PillSync Portal. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    plain = f"PillSync Missed Dose Alert: You missed your {time_of_day.upper()} dose of {medicine_name}. Please update your dashboard logs."
    return send_email(to_email, subject, html, plain)
