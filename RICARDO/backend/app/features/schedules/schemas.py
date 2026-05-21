# Esquemas Pydantic del feature de horarios
import re

from pydantic import BaseModel, Field, field_validator


# Patrón válido para horas en formato "HH:MM" (24h)
TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class BusinessHoursOut(BaseModel):
    id: int
    day_of_week: int
    is_open: bool
    open_time: str
    close_time: str

    class Config:
        from_attributes = True


class BusinessHoursUpdate(BaseModel):
    is_open: bool
    open_time: str = Field(..., description="Hora de apertura HH:MM")
    close_time: str = Field(..., description="Hora de cierre HH:MM")

    @field_validator("open_time", "close_time")
    @classmethod
    def validate_time_format(cls, value: str) -> str:
        if not TIME_PATTERN.match(value):
            raise ValueError("Formato de hora inválido. Use HH:MM (ej: 08:30).")
        return value
