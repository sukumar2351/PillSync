from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, Date, func
from sqlalchemy.orm import relationship
from app.database import Base

class MedicineMaster(Base):
    __tablename__ = "medicine_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    generic_name = Column(String(100), nullable=True)
    brand_name = Column(String(100), nullable=True)
    medicine_type = Column(String(50), nullable=True)  # Tablet, Capsule, Syrup, etc.
    strength = Column(String(50), nullable=True)
    unit = Column(String(20), nullable=True)            # mg, ml, etc.
    manufacturer = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    common_usage = Column(Text, nullable=True)
    side_effects = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)      # Analgesic, Antibiotic, etc.
    approval_status = Column(String(20), default="Approved")  # Approved, Pending
    created_at = Column(DateTime, default=func.now())

class DrugInteraction(Base):
    __tablename__ = "drug_interactions"

    id = Column(Integer, primary_key=True, index=True)
    medicine_a = Column(String(100), nullable=False, index=True)
    medicine_b = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), default="Medium")  # Low, Medium, High
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

class EmergencyCard(Base):
    __tablename__ = "emergency_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    blood_group = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    medical_conditions = Column(Text, nullable=True)
    doctor_name = Column(String(100), nullable=True)
    doctor_contact = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="emergency_card")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    specialization = Column(String(100), nullable=True)
    license_number = Column(String(50), nullable=True)
    hospital = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    gender = Column(String(20), nullable=True)
    approval_status = Column(String(20), default="Pending") # Pending, Approved
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="doctor_profile")
