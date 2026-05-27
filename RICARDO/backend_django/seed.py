# =============================================================================
# Script de seed para AutoServ (Django)
# Ejecutar: python seed.py
# Crea: 3 usuarios base + 10 mecanicos por categoria + catalogo de servicios
#       + horarios del taller por defecto
# =============================================================================
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'autoserv.settings')
django.setup()


from api.models import Bloque, Dia, DiaBloque, Service, User, UserRole  # noqa: E402


def run_seed():
    # -------------------------------------------------------------------
    # USUARIOS BASE
    # -------------------------------------------------------------------
    users_base = [
        {'first_name': 'Carlos', 'last_name': 'Administrador',
         'dni': '00000001', 'email': 'admin@autoserv.com',
         'phone': '999000001', 'password': 'admin123',
         'role': UserRole.ADMIN},
        {'first_name': 'Luis', 'last_name': 'Ramirez',
         'dni': '00000002', 'email': 'mecanico@autoserv.com',
         'phone': '999000002', 'password': 'mecanico123',
         'role': UserRole.MECHANIC, 'specialty': 'Motor'},
        {'first_name': 'Maria', 'last_name': 'Lopez',
         'dni': '00000003', 'email': 'cliente@autoserv.com',
         'phone': '999000003', 'password': 'cliente123',
         'role': UserRole.CLIENT},
    ]

    # MECANICOS ADICIONALES (2 por categoria)
    mechanics_extra = [
        {'first_name': 'Pedro', 'last_name': 'Sanchez', 'dni': '20000001',
         'email': 'pedro.motor@autoserv.com', 'phone': '999100001',
         'specialty': 'Motor'},
        {'first_name': 'Carlos', 'last_name': 'Vargas', 'dni': '20000002',
         'email': 'carlos.suspension@autoserv.com', 'phone': '999100002',
         'specialty': 'Suspensión'},
        {'first_name': 'Diego', 'last_name': 'Torres', 'dni': '20000003',
         'email': 'diego.suspension@autoserv.com', 'phone': '999100003',
         'specialty': 'Suspensión'},
        {'first_name': 'Sofia', 'last_name': 'Rojas', 'dni': '20000004',
         'email': 'sofia.frenos@autoserv.com', 'phone': '999100004',
         'specialty': 'Frenos'},
        {'first_name': 'Andres', 'last_name': 'Quispe', 'dni': '20000005',
         'email': 'andres.electrico@autoserv.com', 'phone': '999100005',
         'specialty': 'Eléctrico'},
        {'first_name': 'Lucia', 'last_name': 'Mendoza', 'dni': '20000006',
         'email': 'lucia.electrico@autoserv.com', 'phone': '999100006',
         'specialty': 'Eléctrico'},
        {'first_name': 'Roberto', 'last_name': 'Diaz', 'dni': '20000007',
         'email': 'roberto.general@autoserv.com', 'phone': '999100007',
         'specialty': 'General'},
        {'first_name': 'Patricia', 'last_name': 'Ruiz', 'dni': '20000008',
         'email': 'patricia.general@autoserv.com', 'phone': '999100008',
         'specialty': 'General'},
        {'first_name': 'JOHN', 'last_name': 'DURAND', 'dni': '20000009',
         'email': 'john@gmail.com', 'phone': '999100009',
         'specialty': 'Frenos'},
    ]

    print('=== Usuarios ===')
    for u in users_base:
        if User.objects.filter(email=u['email']).exists():
            print(f'  Saltado (ya existe): {u["email"]}')
            continue
        password = u.pop('password')
        user = User(**u)
        user.set_password(password)
        user.save()
        print(f'  Creado: {user.email} ({user.role})')

    print('\n=== Mecanicos adicionales ===')
    for m in mechanics_extra:
        if User.objects.filter(email=m['email']).exists():
            print(f'  Saltado: {m["email"]}')
            continue
        user = User(role=UserRole.MECHANIC, **m)
        user.set_password('mecanico123')
        user.save()
        print(f'  Creado: {user.first_name} {user.last_name} ({user.specialty})')

    # -------------------------------------------------------------------
    # SERVICIOS DEL CATALOGO
    # -------------------------------------------------------------------
    services = [
        ('Cambio de aceite', 'Motor', 60, 80.0, 'Cambio de aceite y filtro de calidad.'),
        ('Alineamiento y balanceo', 'Suspensión', 90, 120.0, 'Alineamiento de dirección y balanceo de llantas.'),
        ('Revisión de frenos', 'Frenos', 60, 100.0, 'Revisión general del sistema de frenos y pastillas.'),
        ('Afinamiento básico', 'Motor', 120, 200.0, 'Afinamiento de motor estándar para mantenimiento.'),
        ('Cambio de batería', 'Eléctrico', 30, 60.0, 'Diagnóstico y cambio de batería del vehículo.'),
        ('Revisión general', 'General', 120, 150.0, 'Revisión completa preventiva de todos los sistemas.'),
    ]

    print('\n=== Servicios del catalogo ===')
    for name, cat, dur, price, desc in services:
        s, created = Service.objects.get_or_create(
            name=name,
            defaults={'category': cat, 'duration_minutes': dur,
                      'price': price, 'description': desc},
        )
        print(f'  {"Creado" if created else "Saltado"}: {s.name}')

    # -------------------------------------------------------------------
    # HORARIOS DEL TALLER (estructura Dia + Bloque + DiaBloque)
    # Lun-Vie 8-18, Sab 8-13, Dom cerrado
    # -------------------------------------------------------------------
    schedule = [
        (0, True,  [('08:00', '18:00')]),  # Lunes
        (1, True,  [('08:00', '18:00')]),  # Martes
        (2, True,  [('08:00', '18:00')]),  # Miercoles
        (3, True,  [('08:00', '18:00')]),  # Jueves
        (4, True,  [('08:00', '18:00')]),  # Viernes
        (5, True,  [('08:00', '13:00')]),  # Sabado
        (6, False, []),                    # Domingo cerrado
    ]
    nombres_dia = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

    print('\n=== Horarios (Dia + Bloque + DiaBloque) ===')
    for day, is_open, bloques in schedule:
        dia, created = Dia.objects.get_or_create(
            day_of_week=day,
            defaults={'is_open': is_open},
        )
        if not created:
            dia.is_open = is_open
            dia.save()

        # Limpia y vuelve a asignar los bloques del dia
        DiaBloque.objects.filter(dia=dia).delete()
        for op, cl in bloques:
            bloque, _ = Bloque.objects.get_or_create(open_time=op, close_time=cl)
            DiaBloque.objects.get_or_create(dia=dia, bloque=bloque)
        marca = 'Creado' if created else 'Actualizado'
        bloques_str = ', '.join(f'{a}-{b}' for a, b in bloques) or 'cerrado'
        print(f'  {marca}: {nombres_dia[day]} ({bloques_str})')

    print('\nSeed completado correctamente.')


if __name__ == '__main__':
    run_seed()
