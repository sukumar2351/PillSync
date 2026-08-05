from sqlalchemy import Column, Integer, Date, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RefillPrediction(Base):
    __tablename__ = "refill_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False)
    remaining_quantity = Column(Integer, nullable=False)
    expected_finish_date = Column(Date, nullable=False)
    predicted_refill_date = Column(Date, nullable=False)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", backref="refill_predictions")
    medicine = relationship("Medicine", backref="refill_predictions")
