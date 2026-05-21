# Endpoints HTTP del feature de ordenes de trabajo
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_staff
from app.features.users.models import User
from app.features.work_orders import service
from app.features.work_orders.schemas import (
    WorkOrderCreate,
    WorkOrderItemCreate,
    WorkOrderOut,
    WorkOrderUpdate,
)


router = APIRouter(prefix="/api/work-orders", tags=["Ordenes de Trabajo"])


@router.get("", response_model=list[WorkOrderOut])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Lista las ordenes del taller. El mecánico solo ve las suyas."""
    return service.list_work_orders(db, current_user)


@router.get("/by-appointment/{appointment_id}", response_model=WorkOrderOut)
def get_by_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene la orden de una cita. El cliente solo puede ver las suyas."""
    return service.get_for_appointment(db, appointment_id, current_user)


@router.post("", response_model=WorkOrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    data: WorkOrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Crea (o recupera) la orden de trabajo de una cita en atencion (RF-24)."""
    return service.get_or_create_for_appointment(db, data.appointment_id)


@router.put("/{order_id}/diagnosis", response_model=WorkOrderOut)
def update_diagnosis(
    order_id: int,
    data: WorkOrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Registra o actualiza el diagnostico de la orden (RF-25)."""
    return service.update_diagnosis(db, order_id, data)


@router.post("/{order_id}/items", response_model=WorkOrderOut)
def add_item(
    order_id: int,
    data: WorkOrderItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Agrega un repuesto o cargo a la orden de trabajo (RF-26)."""
    return service.add_item(db, order_id, data)


@router.post("/{order_id}/close", response_model=WorkOrderOut)
def close_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Cierra la orden y marca la cita como completada (RF-27, RN-13)."""
    return service.close_work_order(db, order_id)
