from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app.models.user_models import User, Notification, NotificationSetting

from app.services.auth_service import get_current_user
from app.services.user_service import get_user_profile, update_patient_profile, update_caregiver_profile
from app.schemas.user_schemas import PatientProfileUpdate, CaregiverProfileUpdate, PatientProfileResponse, CaregiverProfileResponse

router = APIRouter(prefix="/users", tags=["Users & Profiles"])


@router.get("/profile")
def read_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve the profile data of the currently authenticated user."""
    profile = get_user_profile(db, current_user)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile


@router.put("/profile")
def modify_profile(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update profile data. Validates details conditionally using Patient or Caregiver rules."""
    role_name = current_user.role.name
    
    try:
        if role_name == "patient":
            # Validates using Patient constraints (e.g. blood group, emergency contact)
            validated = PatientProfileUpdate(**payload)
            update_patient_profile(db, current_user, validated)
        elif role_name == "caregiver":
            # Validates using Caregiver constraints
            validated = CaregiverProfileUpdate(**payload)
            update_caregiver_profile(db, current_user, validated)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators do not have a patient or caregiver profile to update."
            )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )

    return {"message": "Profile updated successfully"}


# ----------------- NOTIFICATION SETTINGS ENDPOINTS -----------------
from app.schemas.user_schemas import NotificationSettingsResponse, NotificationSettingsUpdate
from app.services.sms_service import send_sms
from app.models.user_models import NotificationSetting
from datetime import datetime
import traceback

@router.get("/profile/notifications", response_model=NotificationSettingsResponse)
def get_notification_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve notification and SMS settings for the authenticated patient. Auto-creates defaults."""
    print(f"[*] GET /profile/notifications called by user_id: {current_user.id}")
    if current_user.role.name != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only patients have notification settings.")
    
    try:
        settings = current_user.notification_setting
        if not settings:
            print(f"[*] Notification settings row missing for user_id {current_user.id}. Creating default...")
            default_phone = current_user.patient_profile.phone if current_user.patient_profile else None
            settings = NotificationSetting(
                user_id=current_user.id,
                phone_number=default_phone,
                sms_enabled=False,
                browser_notifications=True,
                notification_frequency="Daily",
                delivery_status="Not Configured"
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
            print("[*] Default settings row created successfully.")
            
        return {
            "phone_number": settings.phone_number,
            "phone": settings.phone_number,
            "sms_enabled": settings.sms_enabled,
            "browser_notifications": settings.browser_notifications,
            "notification_preference": settings.notification_frequency,
            "notification_frequency": settings.notification_frequency,
            "last_sms_sent": settings.last_sms_sent,
            "reminder_status": "Active" if settings.sms_enabled else "Inactive",
            "delivery_status": settings.delivery_status,
            "sms_message_sid": settings.sms_message_sid,
            "sms_error": settings.sms_error,
            "sms_recipient": settings.sms_recipient,
        }
    except Exception as e:
        db.rollback()
        print(f"[ERROR] GET /profile/notifications failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch settings: {str(e)}")


@router.put("/profile/notifications", response_model=NotificationSettingsResponse)
def update_notification_settings(payload: NotificationSettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Modify notification preferences and phone number."""
    print(f"[*] PUT /profile/notifications called by user_id: {current_user.id} with payload: {payload.dict()}")
    if current_user.role.name != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only patients have notification settings.")
        
    try:
        settings = current_user.notification_setting
        if not settings:
            print(f"[*] Settings row missing during update. Creating base row...")
            default_phone = current_user.patient_profile.phone if current_user.patient_profile else None
            settings = NotificationSetting(
                user_id=current_user.id,
                phone_number=default_phone,
                sms_enabled=False,
                browser_notifications=True,
                notification_frequency="Daily",
                delivery_status="Not Configured"
            )
            db.add(settings)
            db.flush()

        # Determine phone fields
        phone_to_set = payload.phone_number if payload.phone_number is not None else payload.phone
        if phone_to_set is not None:
            settings.phone_number = phone_to_set
            # Keep patient profile phone in sync
            if current_user.patient_profile:
                current_user.patient_profile.phone = phone_to_set

        settings.sms_enabled = payload.sms_enabled
        settings.browser_notifications = payload.browser_notifications
        settings.notification_frequency = payload.notification_frequency

        db.commit()
        db.refresh(settings)
        print("[*] Settings updated successfully in database.")
        
        return {
            "phone_number": settings.phone_number,
            "phone": settings.phone_number,
            "sms_enabled": settings.sms_enabled,
            "browser_notifications": settings.browser_notifications,
            "notification_preference": settings.notification_frequency,
            "notification_frequency": settings.notification_frequency,
            "last_sms_sent": settings.last_sms_sent,
            "reminder_status": "Active" if settings.sms_enabled else "Inactive",
            "delivery_status": settings.delivery_status,
            "sms_message_sid": settings.sms_message_sid,
            "sms_error": settings.sms_error,
            "sms_recipient": settings.sms_recipient,
        }
    except Exception as e:
        db.rollback()
        print(f"[ERROR] PUT /profile/notifications failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update settings: {str(e)}")


@router.post("/profile/notifications/test-sms")
def send_test_sms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Send a test verification SMS to the user's configured mobile number via Twilio (live)."""
    print(f"[*] POST /profile/notifications/test-sms called by user_id: {current_user.id}")
    if current_user.role.name != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only patients can send test SMS.")
        
    try:
        settings = current_user.notification_setting
        if not settings:
            print(f"[*] Settings row missing during test SMS. Auto-creating...")
            default_phone = current_user.patient_profile.phone if current_user.patient_profile else None
            settings = NotificationSetting(
                user_id=current_user.id,
                phone_number=default_phone,
                sms_enabled=False,
                browser_notifications=True,
                notification_frequency="Daily",
                delivery_status="Not Configured"
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        if not settings.phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please configure a phone number in Notification Settings before sending a test SMS."
            )

        print(f"[*] Dispatching LIVE Twilio SMS to: {settings.phone_number}")
        body = (
            "Hello! This is a test SMS from PillSync confirming your notification "
            "configuration is working correctly. You will now receive medicine reminders on this number."
        )

        try:
            res = send_sms(settings.phone_number, body)
        except RuntimeError as cred_err:
            # Credentials not configured — return a clear 503 error
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"SMS service is not configured: {cred_err}"
            )

        # Persist full audit trail in database
        settings.last_sms_sent = datetime.utcnow()
        settings.sms_recipient = res.get("to", settings.phone_number)

        if res.get("status") == "success":
            settings.delivery_status = res.get("delivery_status", "queued")
            settings.sms_message_sid = res.get("sid")
            settings.sms_error = None
            
            # Create a success notification
            test_notif = Notification(
                user_id=current_user.id,
                title="Test SMS Sent Successfully",
                message=f"A real test SMS verification has been queued/delivered to {settings.sms_recipient} via Twilio.",
                type="sms",
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(test_notif)
            db.commit()
            
            print(f"[*] Test SMS SUCCESS — SID={settings.sms_message_sid}, Status={settings.delivery_status}")
            return {
                "message": "Test SMS sent successfully via Twilio!",
                "sid": settings.sms_message_sid,
                "delivery_status": settings.delivery_status,
                "recipient": settings.sms_recipient,
                "provider": "Twilio",
            }
        else:
            settings.delivery_status = "failed"
            settings.sms_error = res.get("error", "Unknown error")
            settings.sms_message_sid = None
            
            # Create a failure notification
            fail_notif = Notification(
                user_id=current_user.id,
                title="Test SMS Dispatch Failed",
                message=f"Attempt to send a test SMS to {settings.phone_number} failed. Error: {settings.sms_error}",
                type="sms",
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(fail_notif)
            db.commit()
            
            error_detail = res.get("error", "Twilio returned a failure status.")
            print(f"[*] Test SMS FAILED — error: {error_detail}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"SMS delivery failed: {error_detail}"
            )


    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] POST /profile/notifications/test-sms failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dispatch test SMS: {str(e)}"
        )

