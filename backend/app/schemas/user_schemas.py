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
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    profile_photo: Optional[str] = None

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
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    profile_photo: Optional[str] = None

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


# ----------------- MEDICINE SCHEMAS -----------------
from datetime import date

class MedicineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    dosage: str = Field(..., min_length=1, max_length=50)
    quantity: int = Field(..., gt=0)
    frequency: str = Field(..., min_length=1, max_length=50)
    morning: bool = False
    afternoon: bool = False
    night: bool = False
    food_relation: str = Field(..., description="'Before Food' or 'After Food'")
    start_date: date
    end_date: date
    notes: Optional[str] = None

    @field_validator("food_relation")
    @classmethod
    def validate_food_relation(cls, v: str) -> str:
        allowed = {"Before Food", "After Food"}
        if v not in allowed:
            raise ValueError("food_relation must be 'Before Food' or 'After Food'")
        return v


class MedicineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    dosage: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[int] = Field(None, gt=0)
    frequency: Optional[str] = Field(None, min_length=1, max_length=50)
    morning: Optional[bool] = None
    afternoon: Optional[bool] = None
    night: Optional[bool] = None
    food_relation: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("food_relation")
    @classmethod
    def validate_food_relation(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"Before Food", "After Food"}
        if v not in allowed:
            raise ValueError("food_relation must be 'Before Food' or 'After Food'")
        return v


class ReminderScheduleResponse(BaseModel):
    id: int
    medicine_id: int
    time_of_day: str
    scheduled_time: str

    class Config:
        from_attributes = True


class MedicineResponse(BaseModel):
    id: int
    user_id: int
    name: str
    dosage: str
    quantity: int
    frequency: str
    morning: bool
    afternoon: bool
    night: bool
    food_relation: str
    start_date: date
    end_date: date
    notes: Optional[str] = None
    created_at: datetime
    reminder_schedules: List[ReminderScheduleResponse] = []

    class Config:
        from_attributes = True


# ----------------- REMINDER LOG SCHEMAS -----------------

class ReminderLogRequest(BaseModel):
    status: str = Field(..., description="'Taken', 'Missed', or 'Snoozed'")
    time_of_day: str = Field(..., description="'Morning', 'Afternoon', 'Night'")
    scheduled_date: date

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"Taken", "Missed", "Snoozed"}
        if v not in allowed:
            raise ValueError("status must be 'Taken', 'Missed', or 'Snoozed'")
        return v


class MedicationHistoryResponse(BaseModel):
    id: int
    user_id: int
    medicine_id: Optional[int] = None
    medicine_name: str
    dosage: str
    time_of_day: str
    status: str
    action_time: datetime
    scheduled_date: date

    class Config:
        from_attributes = True


class AdherenceStatsResponse(BaseModel):
    total_scheduled: int
    taken_count: int
    missed_count: int
    snoozed_count: int
    adherence_rate: float
    history: List[MedicationHistoryResponse]


# ----------------- NOTIFICATION SETTINGS SCHEMAS -----------------

class NotificationSettingsResponse(BaseModel):
    use_primary_email: bool
    reminder_email: Optional[str] = None
    email_enabled: bool
    browser_notifications: bool
    notification_preference: str
    notification_frequency: str
    last_email_sent: Optional[datetime] = None
    reminder_status: Optional[str] = None
    delivery_status: Optional[str] = None
    email_message_sid: Optional[str] = None
    email_error: Optional[str] = None
    email_recipient: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationSettingsUpdate(BaseModel):
    use_primary_email: bool
    reminder_email: Optional[str] = None
    email_enabled: bool
    browser_notifications: bool
    notification_frequency: str
    notification_preference: str


class EmailUpdateRequest(BaseModel):
    new_email: EmailStr
    password: str



