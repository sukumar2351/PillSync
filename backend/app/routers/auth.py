from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.schemas.user_schemas import PatientRegister, CaregiverRegister, UserLogin, Token, UserResponse
from app.services.auth_service import register_patient, register_caregiver, authenticate_user, get_current_user
from app.utils.security import create_access_token
from app.models.user_models import User
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register/patient", status_code=status.HTTP_201_CREATED)
def register_as_patient(schema: PatientRegister, db: Session = Depends(get_db)):
    """Register a new patient and create their empty profile."""
    user = register_patient(db, schema)
    return {"message": "Registration successful", "user_id": user.id}


@router.post("/register/caregiver", status_code=status.HTTP_201_CREATED)
def register_as_caregiver(schema: CaregiverRegister, db: Session = Depends(get_db)):
    """Register a new caregiver and create their empty profile."""
    user = register_caregiver(db, schema)
    return {"message": "Registration successful", "user_id": user.id}


@router.post("/login", response_model=Token)
def login(schema: UserLogin, db: Session = Depends(get_db)):
    """Authenticate credentials and generate a JWT access token."""
    user = authenticate_user(db, schema.email, schema.password)
    
    # Generate token
    token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.name, "uid": user.id},
        expires_delta=token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.name,
        "email": user.email
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_details(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve full details of the currently logged-in user and their profile."""
    from app.services.user_service import get_user_profile
    profile = get_user_profile(db, current_user)
    
    # Return UserResponse schema
    role_name = current_user.role.name
    
    # Structure profile response based on role type
    profile_data = None
    if profile:
        if role_name == "patient":
            profile_data = {
                "id": profile.id,
                "full_name": profile.full_name,
                "phone": profile.phone,
                "age": profile.age,
                "gender": profile.gender,
                "blood_group": profile.blood_group,
                "address": profile.address,
                "emergency_contact": profile.emergency_contact,
                "account_status": profile.account_status,
                "caregiver_name": profile.caregiver.full_name if profile.caregiver else None
            }
        elif role_name == "caregiver":
            profile_data = {
                "id": profile.id,
                "full_name": profile.full_name,
                "phone": profile.phone,
                "age": profile.age,
                "gender": profile.gender,
                "address": profile.address,
                "account_status": profile.account_status,
                "emergency_contact": profile.emergency_contact,
                "emergency_phone": profile.emergency_phone,
                "profile_photo": profile.profile_photo
            }
            
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": role_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "profile": profile_data
    }


from pydantic import BaseModel, EmailStr
import random
from datetime import datetime
from app.models.user_models import PasswordResetToken
from app.services.email_service import send_email
from app.utils.security import get_password_hash

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    password: str

@router.post("/forgot-password")
def forgot_password(schema: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == schema.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found.")
        
    otp = f"{random.randint(100000, 999999)}"
    
    otp_record = PasswordResetToken(
        email=schema.email,
        otp_code=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=5)
    )
    db.add(otp_record)
    db.commit()
    
    subject = "PillSync Password Reset OTP"
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background: #fafafa;">
          <h2 style="color: #2563eb; text-align: center;">PillSync Security</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the following One-Time Password (OTP) to complete the verification. This OTP is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0; font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #2563eb;">
            {otp}
          </div>
          <p>If you did not request this reset, please ignore this email.</p>
          <br/>
          <p>Warm regards,<br/>The PillSync Team</p>
        </div>
      </body>
    </html>
    """
    try:
        send_email(to_email=schema.email, subject=subject, html_body=html_body, plain_body=f"Your PillSync Reset OTP is: {otp}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch reset email: {str(e)}")
        
    return {"message": "Verification OTP sent successfully to your registered email."}

@router.post("/verify-otp")
def verify_otp(schema: VerifyOTPRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == schema.email,
        PasswordResetToken.otp_code == schema.otp,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).order_by(PasswordResetToken.created_at.desc()).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
        
    return {"message": "OTP verified successfully. You may now reset your password."}

@router.post("/reset-password")
def reset_password(schema: ResetPasswordRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == schema.email,
        PasswordResetToken.otp_code == schema.otp,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).order_by(PasswordResetToken.created_at.desc()).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
        
    user = db.query(User).filter(User.email == schema.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    user.hashed_password = get_password_hash(schema.password)
    record.used = True
    db.commit()
    
    return {"message": "Password reset completed successfully."}
