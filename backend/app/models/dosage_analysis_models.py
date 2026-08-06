from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DosageAnalysisResult(Base):
    __tablename__ = "dosage_analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False)
    severity = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH
    issue = Column(String(255), nullable=False)  # description of the issue
    details = Column(Text, nullable=True)  # optional detailed info (JSON string)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", backref="dosage_analysis_results")
    medicine = relationship("Medicine", backref="dosage_analysis_results")


class AdherenceMetric(Base):
    __tablename__ = "adherence_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_doses = Column(Integer, default=0)
    taken = Column(Integer, default=0)
    missed = Column(Integer, default=0)
    late = Column(Integer, default=0)
    adherence_pct = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    calculated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", backref="adherence_metric")
