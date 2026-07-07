import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Union, List
from datetime import datetime

# ----------------- AUTH SCHEMAS -----------------

class PatientRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Full name must contain only letters and spaces")
        return v.strip()


class CaregiverRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Full name must contain only letters and spaces")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


# ----------------- PROFILE SCHEMAS -----------------

class PatientProfileResponse(BaseModel):
    id: int
    full_name: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    account_status: str

    class Config:
        from_attributes = True


class CaregiverProfileResponse(BaseModel):
    id: int
    full_name: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    account_status: str

    class Config:
        from_attributes = True


class PatientProfileUpdate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        # Support optional +, digits, spaces, hyphens, parentheses (length 10-15 digits)
        clean = re.sub(r"[\s\-\(\)\+]", "", v)
        if not clean.isdigit() or len(clean) < 10 or len(clean) > 15:
            raise ValueError("Phone number must contain between 10 and 15 digits")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 120):
            raise ValueError("Age must be between 0 and 120")
        return v

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        allowed = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
        if v.upper() not in allowed:
            raise ValueError(f"Blood group must be one of: {', '.join(allowed)}")
        return v.upper()

    @field_validator("emergency_contact")
    @classmethod
    def validate_emergency_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        # Simple length validation for emergency contact name/phone
        if len(v) < 2:
            raise ValueError("Emergency contact detail must be at least 2 characters long")
        return v


class CaregiverProfileUpdate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        clean = re.sub(r"[\s\-\(\)\+]", "", v)
        if not clean.isdigit() or len(clean) < 10 or len(clean) > 15:
            raise ValueError("Phone number must contain between 10 and 15 digits")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 120):
            raise ValueError("Age must be between 0 and 120")
        return v


# ----------------- USER RESPONSES -----------------

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime
    profile: Optional[Union[PatientProfileResponse, CaregiverProfileResponse]] = None

    class Config:
        from_attributes = True


# ----------------- ADMIN DASHBOARD SCHEMAS -----------------

class LatestUserResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_patients: int
    total_caregivers: int
    todays_registrations: int
    active_users: int
    inactive_users: int
    latest_users: List[LatestUserResponse]
