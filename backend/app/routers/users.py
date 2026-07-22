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


from app.utils.security import verify_password
from app.schemas.user_schemas import EmailUpdateRequest

@router.put("/profile/email")
def update_primary_email(payload: EmailUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update primary login and account email after verifying password and duplicate checks."""
    print(f"[*] PUT /users/profile/email called by user_id: {current_user.id} with email: {payload.new_email}")
    
    # 1. Verify password
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password confirmation."
        )
        
    # 2. Check duplicate email
    existing_user = db.query(User).filter(User.email == payload.new_email).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already in use by another account."
        )
        
    # 3. Update email in database
    current_user.email = payload.new_email
    db.commit()
    db.refresh(current_user)
    print(f"[*] Email updated successfully for user_id {current_user.id} to: {payload.new_email}")
    return {"message": "Primary Email updated successfully", "email": current_user.email}


# ----------------- NOTIFICATION SETTINGS ENDPOINTS -----------------
from app.schemas.user_schemas import NotificationSettingsResponse, NotificationSettingsUpdate
from app.services.email_service import send_email
from app.models.user_models import NotificationSetting
from datetime import datetime
import traceback

@router.get("/profile/notifications", response_model=NotificationSettingsResponse)
def get_notification_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve notification and Email settings for the authenticated patient. Auto-creates defaults."""
    print(f"[*] GET /profile/notifications called by user_id: {current_user.id}")
    if current_user.role.name != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only patients have notification settings.")
    
    try:
        settings = current_user.notification_setting
        if not settings:
            print(f"[*] Notification settings row missing for user_id {current_user.id}. Creating default...")
            settings = NotificationSetting(
                user_id=current_user.id,
                use_primary_email=True,
                reminder_email=current_user.email,
                email_enabled=False,
                browser_notifications=True,
                notification_frequency="Daily",
                delivery_status="Not Configured"
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
            print("[*] Default settings row created successfully.")
        
        # Default reminder email if null
        if settings.reminder_email is None:
            settings.reminder_email = current_user.email
            db.commit()
            db.refresh(settings)
            
        return {
            "use_primary_email": settings.use_primary_email,
            "reminder_email": settings.reminder_email,
            "email_enabled": settings.email_enabled,
            "browser_notifications": settings.browser_notifications,
            "notification_preference": settings.notification_frequency,
            "notification_frequency": settings.notification_frequency,
            "last_email_sent": settings.last_email_sent,
            "reminder_status": "Active" if settings.email_enabled else "Inactive",
            "delivery_status": settings.delivery_status,
            "email_message_sid": settings.email_message_sid,
            "email_error": settings.email_error,
            "email_recipient": settings.email_recipient,
        }
    except Exception as e:
        db.rollback()
        print(f"[ERROR] GET /profile/notifications failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch settings: {str(e)}")


@router.put("/profile/notifications", response_model=NotificationSettingsResponse)
def update_notification_settings(payload: NotificationSettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Modify notification preferences and email address."""
    print(f"[*] PUT /profile/notifications called by user_id: {current_user.id} with payload: {payload.dict()}")
    if current_user.role.name != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only patients have notification settings.")
        
    try:
        settings = current_user.notification_setting
        if not settings:
            print(f"[*] Settings row missing during update. Creating base row...")
            settings = NotificationSetting(
                user_id=current_user.id,
                use_primary_email=payload.use_primary_email,
                reminder_email=payload.reminder_email or current_user.email,
                email_enabled=payload.email_enabled,
                browser_notifications=payload.browser_notifications,
                notification_frequency=payload.notification_frequency,
                delivery_status="Not Configured"
            )
            db.add(settings)
            db.flush()

        settings.use_primary_email = payload.use_primary_email
        if payload.reminder_email is not None:
            settings.reminder_email = payload.reminder_email
        else:
            settings.reminder_email = current_user.email

        settings.email_enabled = payload.email_enabled
        settings.browser_notifications = payload.browser_notifications
        settings.notification_frequency = payload.notification_frequency

        db.commit()
        db.refresh(settings)
        print("[*] Settings updated successfully in database.")
        
        return {
            "use_primary_email": settings.use_primary_email,
            "reminder_email": settings.reminder_email,
            "email_enabled": settings.email_enabled,
            "browser_notifications": settings.browser_notifications,
            "notification_preference": settings.notification_frequency,
            "notification_frequency": settings.notification_frequency,
            "last_email_sent": settings.last_email_sent,
            "reminder_status": "Active" if settings.email_enabled else "Inactive",
            "delivery_status": settings.delivery_status,
            "email_message_sid": settings.email_message_sid,
            "email_error": settings.email_error,
            "email_recipient": settings.email_recipient,
        }
    except Exception as e:
        db.rollback()
        print(f"[ERROR] PUT /profile/notifications failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update settings: {str(e)}")


@router.post("/profile/notifications/test-email")
def send_test_email(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Send a test verification email to the user's registered email address."""
    print(f"[*] POST /profile/notifications/test-email called by user_id: {current_user.id}")
    if current_user.role.name != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only patients can send test email.")
        
    try:
        settings = current_user.notification_setting
        if not settings:
            settings = NotificationSetting(
                user_id=current_user.id,
                email_enabled=False,
                browser_notifications=True,
                notification_frequency="Daily",
                delivery_status="Not Configured"
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        recipient_email = current_user.email if (settings.use_primary_email or not settings.reminder_email) else settings.reminder_email
        print(f"[*] Dispatching test email to: {recipient_email}")
        
        subject = "PillSync Notification Test"
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #2563eb; margin-top: 0;">PillSync Verification</h2>
              <p>Hi {current_user.patient_profile.full_name if current_user.patient_profile else 'Patient'},</p>
              <p>This is a test verification email from PillSync confirming your email notification system is configured correctly.</p>
              <p>You will now receive scheduled medicine alerts directly at this email address.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 0.8em; color: #94a3b8; text-align: center; margin: 0;">&copy; 2026 PillSync Portal. All rights reserved.</p>
            </div>
          </body>
        </html>
        """
        plain = "Hi, this is a test email from PillSync confirming your email notifications are working correctly."

        try:
            res = send_email(recipient_email, subject, html, plain)
        except RuntimeError as cred_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(cred_err)
            )
        except Exception as smtp_err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"SMTP Server Connection Failed: {smtp_err}"
            )

        settings.last_email_sent = datetime.utcnow()
        settings.email_recipient = res.get("to", recipient_email)

        if res.get("status") == "success":
            settings.delivery_status = res.get("delivery_status", "sent")
            settings.email_message_sid = "Gmail-SMTP"
            settings.email_error = None
            
            test_notif = Notification(
                user_id=current_user.id,
                title="Test Email Sent Successfully",
                message=f"A real test email verification has been sent to {settings.email_recipient} via Gmail SMTP.",
                type="sms",
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(test_notif)
            db.commit()
            
            print(f"[*] Test Email SUCCESS — To={settings.email_recipient}")
            return {
                "message": "Test Email sent successfully!",
                "delivery_status": settings.delivery_status,
                "recipient": settings.email_recipient,
                "provider": "Gmail-SMTP",
            }
        else:
            settings.delivery_status = "failed"
            settings.email_error = res.get("error", "Unknown error")
            settings.email_message_sid = None
            
            fail_notif = Notification(
                user_id=current_user.id,
                title="Test Email Dispatch Failed",
                message=f"Attempt to send a test email to {recipient_email} failed. Error: {settings.email_error}",
                type="sms",
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(fail_notif)
            db.commit()
            
            error_detail = res.get("error", "SMTP returned a failure status.")
            print(f"[*] Test Email FAILED — error: {error_detail}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Email delivery failed: {error_detail}"
            )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] POST /profile/notifications/test-email failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dispatch test email: {str(e)}"
        )
