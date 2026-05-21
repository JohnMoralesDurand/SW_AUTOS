# Modelos ORM de ordenes de trabajo y sus repuestos asociados
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class WorkOrderStatus(str, enum.Enum):
    # Estados de la orden de trabajo
    OPEN = "open"
    CLOSED = "closed"


class WorkOrder(Base):
    # Tabla de ordenes de trabajo (se generan a partir de una cita en atencion)
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, unique=True)
    diagnosis = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.OPEN, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    appointment = relationship("Appointment")
    items = relationship("WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan")


class WorkOrderItem(Base):
    # Repuestos o cargos adicionales registrados en la orden
    __tablename__ = "work_order_items"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    description = Column(String(150), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)

    work_order = relationship("WorkOrder", back_populates="items")
