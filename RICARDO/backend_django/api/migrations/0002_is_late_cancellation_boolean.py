# Migracion: convierte is_late_cancellation de texto ('true'/'false') a
# un BooleanField de verdad.
#
# No se puede cambiar el tipo directo porque SQLite copiaria los textos
# tal cual y al leerlos Django tomaria 'false' como verdadero (cualquier
# texto no vacio es "truthy" en Python). Por eso va en 4 pasos:
#   1. Agrego una columna booleana temporal.
#   2. Copio los datos convirtiendo 'true' -> True y el resto -> False.
#   3. Borro la columna de texto vieja.
#   4. Renombro la temporal al nombre original.
from django.db import migrations, models


def copiar_a_booleano(apps, schema_editor):
    Appointment = apps.get_model('api', 'Appointment')
    for ap in Appointment.objects.all():
        ap.is_late_cancellation_bool = (ap.is_late_cancellation == 'true')
        ap.save(update_fields=['is_late_cancellation_bool'])


def revertir_a_texto(apps, schema_editor):
    Appointment = apps.get_model('api', 'Appointment')
    for ap in Appointment.objects.all():
        ap.is_late_cancellation = 'true' if ap.is_late_cancellation_bool else 'false'
        ap.save(update_fields=['is_late_cancellation'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='is_late_cancellation_bool',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(copiar_a_booleano, revertir_a_texto),
        migrations.RemoveField(
            model_name='appointment',
            name='is_late_cancellation',
        ),
        migrations.RenameField(
            model_name='appointment',
            old_name='is_late_cancellation_bool',
            new_name='is_late_cancellation',
        ),
    ]
