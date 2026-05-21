# Esquemas Pydantic para ordenes de trabajo
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.features.work_orders.models import WorkOrderStatus


class WorkOrderItemCreate(BaseModel):
    # Repuesto o item agregado a la orden
    description: str = Field(..., min_length=2, max_length=150)
    quantity: int = Field(1, ge=1)
    unit_price: float = Field(..., ge=0)


class WorkOrderItemOut(BaseModel):
    id: int
    description: str
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True


class WorkOrderCreate(BaseModel):
    # La orden se crea automaticamente al iniciar la cita
    appointment_id: int


class WorkOrderUpdate(BaseModel):
    # Datos editables al trabajar la orden
    diagnosis: Optional[str] = None


class WorkOrderOut(BaseModel):
    id: int
    appointment_id: int
    diagnosis: Optional[str]
    total_amount: float
    status: WorkOrderStatus
    closed_at: Optional[datetime]
    created_at: datetime
    items: List[WorkOrderItemOut] = []

    # Datos enriquecidos para mostrar al cliente
    mechanic_name: Optional[str] = None
    service_name: Optional[str] = None
    vehicle_plate: Optional[str] = None

    # Número correlativo por usuario: cada mecánico ve sus encargos como #1, #2, ...
    display_number: Optional[int] = None

    class Config:
        from_attributes = True
