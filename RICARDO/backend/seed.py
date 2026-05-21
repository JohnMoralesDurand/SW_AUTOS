# Script para crear datos iniciales en la base de datos
# Ejecutar con: python seed.py
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.features.services.models import Service
from app.features.users.models import User, UserRole


def run_seed():
    """Crea un administrador, mecanicos de prueba y servicios iniciales."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Administrador por defecto
        if not db.query(User).filter(User.email == "admin@autoserv.com").first():
            admin = User(
                first_name="Carlos",
                last_name="Administrador",
                dni="00000001",
                email="admin@autoserv.com",
                phone="999000001",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            print("Administrador creado: admin@autoserv.com / admin123")

        # Mecanico de prueba
        if not db.query(User).filter(User.email == "mecanico@autoserv.com").first():
            mechanic = User(
                first_name="Luis",
                last_name="Ramirez",
                dni="00000002",
                email="mecanico@autoserv.com",
                phone="999000002",
                password_hash=hash_password("mecanico123"),
                role=UserRole.MECHANIC,
                specialty="Motor",
                work_schedule="Lunes a Sábado 08:00-17:00",
            )
            db.add(mechanic)
            print("Mecanico creado: mecanico@autoserv.com / mecanico123")

        # Cliente de prueba
        if not db.query(User).filter(User.email == "cliente@autoserv.com").first():
            client = User(
                first_name="Maria",
                last_name="Lopez",
                dni="12345678",
                email="cliente@autoserv.com",
                phone="999000003",
                password_hash=hash_password("cliente123"),
                role=UserRole.CLIENT,
            )
            db.add(client)
            print("Cliente creado: cliente@autoserv.com / cliente123")

        # Catálogo inicial de servicios
        initial_services = [
            ("Cambio de aceite", "Cambio de aceite y filtro de calidad.", "Motor", 60, 80.0),
            ("Alineamiento y balanceo", "Alineamiento de dirección y balanceo de llantas.", "Suspensión", 90, 120.0),
            ("Revisión de frenos", "Revisión general del sistema de frenos y pastillas.", "Frenos", 60, 100.0),
            ("Afinamiento básico", "Afinamiento de motor estándar para mantenimiento.", "Motor", 120, 200.0),
            ("Cambio de batería", "Diagnóstico y cambio de batería del vehículo.", "Eléctrico", 30, 60.0),
            ("Revisión general", "Revisión completa preventiva de todos los sistemas.", "General", 120, 150.0),
        ]
        for name, description, category, duration, price in initial_services:
            if not db.query(Service).filter(Service.name == name).first():
                db.add(
                    Service(
                        name=name,
                        description=description,
                        category=category,
                        duration_minutes=duration,
                        price=price,
                    )
                )

        db.commit()
        print("Seed completado correctamente.")

    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
