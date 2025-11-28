from django.db import migrations, transaction
from django.db.models import Max


def assign_display_ids(apps, schema_editor):
    Clientes = apps.get_model('Dashboard', 'Clientes')
    START = 1000

    with transaction.atomic():
        # determinar el punto de partida
        agg = Clientes.objects.filter(
            display_id__isnull=False, display_id__gte=START).aggregate(max_id=Max('display_id'))
        max_id = agg.get('max_id') or 0
        current = max(max_id + 1, START)

        # seleccionar clientes que aún no tienen display_id
        qs = Clientes.objects.filter(display_id__isnull=True).order_by('id')
        for cliente in qs.select_for_update():
            cliente.display_id = current
            # usar save() del modelo histórico (no ejecutará la lógica moderna)
            cliente.save(update_fields=['display_id'])
            current += 1


class Migration(migrations.Migration):

    dependencies = [
        ('Dashboard', '0010_clientes_display_id'),
    ]

    operations = [
        migrations.RunPython(assign_display_ids,
                             reverse_code=migrations.RunPython.noop),
    ]
