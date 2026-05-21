# Logica del feature de reportes y estadisticas
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.features.appointments.models import Appointment, AppointmentStatus
from app.features.services.models import Service
from app.features.work_orders.models import WorkOrder, WorkOrderStatus


def appointments_by_period(db: Session, start: datetime, end: datetime):
    """Cuenta las citas agrupadas por dia dentro del rango (RF-31)."""
    rows = (
        db.query(
            func.date(Appointment.scheduled_at).label("day"),
            func.count(Appointment.id).label("total"),
        )
        .filter(Appointment.scheduled_at >= start, Appointment.scheduled_at <= end)
        .group_by(func.date(Appointment.scheduled_at))
        .order_by("day")
        .all()
    )
    return [{"day": str(r.day), "total": r.total} for r in rows]


def top_requested_services(db: Session, limit: int = 5):
    """Devuelve los servicios mas solicitados (RF-32)."""
    rows = (
        db.query(Service.name, func.count(Appointment.id).label("total"))
        .join(Appointment, Appointment.service_id == Service.id)
        .group_by(Service.name)
        .order_by(func.count(Appointment.id).desc())
        .limit(limit)
        .all()
    )
    return [{"service": r[0], "total": r[1]} for r in rows]


def income_report(db: Session, start: datetime, end: datetime):
    """Calcula los ingresos generados por ordenes cerradas en el periodo (RF-33)."""
    total = (
        db.query(func.coalesce(func.sum(WorkOrder.total_amount), 0))
        .filter(
            WorkOrder.status == WorkOrderStatus.CLOSED,
            WorkOrder.closed_at >= start,
            WorkOrder.closed_at <= end,
        )
        .scalar()
    )
    return {"start": start, "end": end, "total_income": float(total or 0)}


def dashboard_summary(db: Session):
    """Resumen general usado por el dashboard administrativo."""
    total_clients = db.query(func.count(Appointment.client_id.distinct())).scalar() or 0
    total_appointments = db.query(func.count(Appointment.id)).scalar() or 0
    pending = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.status == AppointmentStatus.PENDING)
        .scalar()
        or 0
    )
    completed = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.status == AppointmentStatus.COMPLETED)
        .scalar()
        or 0
    )

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    weekly_income = income_report(db, week_ago, datetime.utcnow())

    return {
        "total_clients": total_clients,
        "total_appointments": total_appointments,
        "pending_appointments": pending,
        "completed_appointments": completed,
        "weekly_income": weekly_income["total_income"],
    }
