# Logica de negocio del feature de ordenes de trabajo
# Aplica las reglas RN-13 (cierre con diagnostico) y otras
from datetime import datetime
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.features.appointments.models import Appointment, AppointmentStatus
from app.features.notifications import service as notification_service
from app.features.notifications.models import NotificationType
from app.features.users.models import User, UserRole
from app.features.work_orders.models import WorkOrder, WorkOrderItem, WorkOrderStatus
from app.features.work_orders.schemas import (
    WorkOrderItemCreate,
    WorkOrderItemOut,
    WorkOrderOut,
    WorkOrderUpdate,
)


def get_or_create_for_appointment(db: Session, appointment_id: int) -> WorkOrder:
    """Genera (o devuelve) la orden de trabajo de una cita en atencion (RF-24)."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if appointment.status != AppointmentStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="La cita debe estar en atencion")

    work_order = db.query(WorkOrder).filter(WorkOrder.appointment_id == appointment_id).first()
    if work_order:
        return work_order

    work_order = WorkOrder(
        appointment_id=appointment.id,
        total_amount=appointment.frozen_price,
    )
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    return work_order


def update_diagnosis(db: Session, work_order_id: int, data: WorkOrderUpdate) -> WorkOrder:
    """Registra o actualiza el diagnostico tecnico (RF-25)."""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if data.diagnosis is not None:
        work_order.diagnosis = data.diagnosis

    db.commit()
    db.refresh(work_order)
    return work_order


def add_item(db: Session, work_order_id: int, data: WorkOrderItemCreate) -> WorkOrder:
    """Agrega un repuesto o cargo a la orden y recalcula el total (RF-26)."""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if work_order.status == WorkOrderStatus.CLOSED:
        raise HTTPException(status_code=400, detail="La orden ya esta cerrada")

    item = WorkOrderItem(
        work_order_id=work_order.id,
        description=data.description,
        quantity=data.quantity,
        unit_price=data.unit_price,
    )
    db.add(item)
    db.flush()

    # Recalcular total: precio del servicio + items
    items_total = sum(i.quantity * i.unit_price for i in work_order.items)
    work_order.total_amount = work_order.appointment.frozen_price + items_total
    db.commit()
    db.refresh(work_order)
    return work_order


def close_work_order(db: Session, work_order_id: int) -> WorkOrder:
    """Cierra la orden y completa la cita asociada (RF-27, RN-13)."""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # RN-13: la orden debe tener diagnostico y al menos un item para cerrarse
    if not work_order.diagnosis:
        raise HTTPException(status_code=400, detail="Falta registrar el diagnostico")
    if not work_order.items:
        raise HTTPException(status_code=400, detail="Debe registrar al menos un repuesto o cargo")

    work_order.status = WorkOrderStatus.CLOSED
    work_order.closed_at = datetime.utcnow()
    work_order.appointment.status = AppointmentStatus.COMPLETED
    db.commit()
    db.refresh(work_order)

    # Avisa al cliente con un resumen del servicio finalizado
    appointment = work_order.appointment
    service_name = appointment.service.name if appointment.service else "su servicio"
    plate = appointment.vehicle.license_plate if appointment.vehicle else ""
    notification_service.create_notification(
        db,
        user_id=appointment.client_id,
        notif_type=NotificationType.SERVICE_COMPLETED,
        title="Tu servicio fue completado",
        message=(
            f"El servicio '{service_name}' para el vehículo {plate} ha sido finalizado. "
            f"Total: S/ {work_order.total_amount:.2f}. Ya puedes recoger tu auto."
        ),
    )

    return work_order


def list_work_orders(db: Session, user: User) -> List[WorkOrderOut]:
    """Lista las ordenes visibles para el usuario, con número correlativo por usuario.

    El admin ve todas; el mecánico solo las de sus citas asignadas.
    Cada usuario recibe un display_number 1..N en orden cronológico de creación,
    de modo que el primer encargo que vio sea su #1.
    """
    query = db.query(WorkOrder)
    if user.role == UserRole.MECHANIC:
        query = query.join(Appointment).filter(Appointment.mechanic_id == user.id)

    # Numeramos en orden cronológico ascendente (más antigua = #1)
    chronological = query.order_by(WorkOrder.created_at.asc()).all()
    sequence = {wo.id: idx + 1 for idx, wo in enumerate(chronological)}

    # Pero mostramos en orden descendente (más reciente arriba)
    result: List[WorkOrderOut] = []
    for wo in sorted(chronological, key=lambda w: w.created_at, reverse=True):
        out = _enrich(wo)
        out.display_number = sequence[wo.id]
        result.append(out)
    return result


def _enrich(work_order: WorkOrder) -> WorkOrderOut:
    """Convierte la orden en un esquema con datos relacionados (mecánico, servicio)."""
    appointment = work_order.appointment
    mechanic_name = None
    if appointment and appointment.mechanic:
        mechanic_name = f"{appointment.mechanic.first_name} {appointment.mechanic.last_name}"

    return WorkOrderOut(
        id=work_order.id,
        appointment_id=work_order.appointment_id,
        diagnosis=work_order.diagnosis,
        total_amount=work_order.total_amount,
        status=work_order.status,
        closed_at=work_order.closed_at,
        created_at=work_order.created_at,
        items=[WorkOrderItemOut.model_validate(i) for i in work_order.items],
        mechanic_name=mechanic_name,
        service_name=appointment.service.name if appointment and appointment.service else None,
        vehicle_plate=appointment.vehicle.license_plate if appointment and appointment.vehicle else None,
    )


def get_for_appointment(db: Session, appointment_id: int, user: User) -> WorkOrderOut:
    """Devuelve la orden de una cita; el cliente solo accede a las suyas."""
    work_order = (
        db.query(WorkOrder).filter(WorkOrder.appointment_id == appointment_id).first()
    )
    if not work_order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # Un cliente solo puede ver la orden de sus propias citas
    if user.role == UserRole.CLIENT and work_order.appointment.client_id != user.id:
        raise HTTPException(status_code=403, detail="No tiene acceso a esta orden")

    return _enrich(work_order)
