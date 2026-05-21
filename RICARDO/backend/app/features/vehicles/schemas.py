# Esquemas Pydantic del feature de vehiculos
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator
import re


# Expresion regular para placas peruanas: ABC-123 o A1B-234
PLATE_PATTERN = re.compile(r"^[A-Z0-9]{3}-\d{3}$")


class VehicleBase(BaseModel):
    # Campos comunes para los esquemas de vehiculos
    license_plate: str = Field(..., min_length=7, max_length=8)
    brand: str = Field(..., min_length=1, max_length=60)
    model: str = Field(..., min_length=1, max_length=60)
    year: int = Field(..., ge=1950, le=2100)
    mileage: int = Field(0, ge=0)
    color: Optional[str] = None

    @field_validator("license_plate")
    @classmethod
    def validate_plate(cls, value: str) -> str:
        # Aplica la regla RN-02 (formato peruano de placa)
        plate = value.upper().strip()
        if not PLATE_PATTERN.match(plate):
            raise ValueError("Formato de placa invalido (ejemplo: ABC-123)")
        return plate


class VehicleCreate(VehicleBase):
    # Datos para registrar un nuevo vehiculo
    pass


class VehicleUpdate(BaseModel):
    # Campos modificables del vehiculo
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    color: Optional[str] = None


class VehicleOut(BaseModel):
    # Forma del vehiculo en las respuestas del API
    id: int
    owner_id: int
    license_plate: str
    brand: str
    model: str
    year: int
    mileage: int
    color: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
