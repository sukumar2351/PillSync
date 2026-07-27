from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, Date, func
from sqlalchemy.orm import relationship
from app.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    role = relationship("Role", back_populates="users")
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    caregiver_profile = relationship("CaregiverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    medicines = relationship("Medicine", back_populates="user", cascade="all, delete-orphan")
    medication_histories = relationship("MedicationHistory", back_populates="user", cascade="all, delete-orphan")
    notification_setting = relationship("NotificationSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")



class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    account_status = Column(String(20), default="Active")
    email_enabled = Column(Boolean, default=False)
    notification_preference = Column(String(50), default="browser")
    reminder_status = Column(String(50), nullable=True)
    delivery_status = Column(String(50), nullable=True)
    caregiver_id = Column(Integer, ForeignKey("caregiver_profiles.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", back_populates="patient_profile")
    caregiver = relationship("CaregiverProfile", back_populates="assigned_patients")


class CaregiverProfile(Base):
    __tablename__ = "caregiver_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    account_status = Column(String(20), default="Active")
    emergency_contact = Column(String(100), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    profile_photo = Column(Text, nullable=True)

    user = relationship("User", back_populates="caregiver_profile")
    assigned_patients = relationship("PatientProfile", back_populates="caregiver")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    dosage = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    frequency = Column(String(50), nullable=False)
    morning = Column(Boolean, default=False)
    afternoon = Column(Boolean, default=False)
    night = Column(Boolean, default=False)
    food_relation = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="medicines")
    reminder_schedules = relationship("ReminderSchedule", back_populates="medicine", cascade="all, delete-orphan")


class ReminderSchedule(Base):
    __tablename__ = "reminder_schedules"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False)
    time_of_day = Column(String(20), nullable=False)
    scheduled_time = Column(String(10), nullable=False)

    medicine = relationship("Medicine", back_populates="reminder_schedules")


class MedicationHistory(Base):
    __tablename__ = "medication_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="SET NULL"), nullable=True)
    medicine_name = Column(String(100), nullable=False)
    dosage = Column(String(50), nullable=False)
    time_of_day = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    action_time = Column(DateTime, default=func.now())
    scheduled_date = Column(Date, nullable=False)

    user = relationship("User", back_populates="medication_histories")


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    use_primary_email = Column(Boolean, default=True)
    reminder_email = Column(String(255), nullable=True)
    email_enabled = Column(Boolean, default=False)
    browser_notifications = Column(Boolean, default=True)
    notification_frequency = Column(String(50), default="Daily")
    last_email_sent = Column(DateTime, nullable=True)
    delivery_status = Column(String(50), nullable=True)   # e.g. "sent", "delivered", "failed"
    email_message_sid = Column(String(50), nullable=True)   # Gmail-SMTP / Provider SID
    email_error = Column(Text, nullable=True)               # Last error message if any
    email_recipient = Column(String(255), nullable=True)    # Email recipient
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="notification_setting")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="system")  # "reminder", "sms", "browser", "system"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="notifications")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())



