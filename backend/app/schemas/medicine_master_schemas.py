from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MedicineMasterBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    generic_name: Optional[str] = Field(None, max_length=100)
    brand_name: Optional[str] = Field(None, max_length=100)
    medicine_type: Optional[str] = Field(None, max_length=50) # Tablet, Capsule, Syrup, etc.
    strength: Optional[str] = Field(None, max_length=50)
    unit: Optional[str] = Field(None, max_length=20)
    manufacturer: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    common_usage: Optional[str] = None
    side_effects: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)

class MedicineMasterCreate(MedicineMasterBase):
    pass

class MedicineRequestCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    generic_name: Optional[str] = Field(None, max_length=100)
    medicine_type: Optional[str] = Field("Tablet", max_length=50)
    strength: Optional[str] = Field(None, max_length=50)
    unit: Optional[str] = Field(None, max_length=20)
    category: Optional[str] = Field(None, max_length=100)

class MedicineMasterResponse(MedicineMasterBase):
    id: int
    approval_status: str
    created_at: datetime

    class Config:
        from_attributes = True
