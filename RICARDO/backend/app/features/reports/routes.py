# Endpoints HTTP del feature de reportes
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.features.reports import service
from app.features.users.models import User


router = APIRouter(prefix="/api/reports", tags=["Reportes"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Resumen general para el dashboard administrativo."""
    return service.dashboard_summary(db)


@router.get("/appointments")
def appointments_period(
    start: datetime,
    end: datetime,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Reporte de citas agrupadas por dia (RF-31)."""
    return service.appointments_by_period(db, start, end)


@router.get("/top-services")
def top_services(
    limit: int = 5,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Ranking de servicios mas solicitados (RF-32)."""
    return service.top_requested_services(db, limit)


@router.get("/income")
def income(
    start: datetime,
    end: datetime,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Reporte de ingresos por periodo (RF-33)."""
    return service.income_report(db, start, end)
