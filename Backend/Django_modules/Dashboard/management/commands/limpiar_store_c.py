from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import datetime, date
from Dashboard.models import Ventas, VentaItem, Clientes


class Command(BaseCommand):
    help = 'Limpia datos antiguos en store_c, dejando solo enero y febrero 2026 hasta día 9'

    def handle(self, *args, **options):
        start_date = datetime(2026, 1, 1)
        end_date = datetime(2026, 2, 9, 23, 59, 59)  # Hasta el final del día 9

        with transaction.atomic(using='store_c'):
            # Eliminar Ventas fuera del rango
            ventas_to_delete = Ventas.objects.using('store_c').exclude(
                fecha__gte=start_date,
                fecha__lte=end_date
            )
            count_ventas = ventas_to_delete.count()
            ventas_to_delete.delete()
            self.stdout.write(f'Eliminadas {count_ventas} ventas en store_c')

            # Eliminar VentaItem huérfanos (sin venta)
            venta_items_to_delete = VentaItem.objects.using('store_c').filter(
                venta__isnull=True
            )
            count_items = venta_items_to_delete.count()
            venta_items_to_delete.delete()
            self.stdout.write(
                f'Eliminados {count_items} items huérfanos en store_c')

            # Para Clientes, eliminar aquellos con fecha_registro fuera del rango
            start_date_only = date(2026, 1, 1)
            end_date_only = date(2026, 2, 9)
            clientes_to_delete = Clientes.objects.using('store_c').exclude(
                fecha_registro__gte=start_date_only,
                fecha_registro__lte=end_date_only
            )
            count_clientes = clientes_to_delete.count()
            clientes_to_delete.delete()
            self.stdout.write(
                f'Eliminados {count_clientes} clientes en store_c')

            # Productos no tienen fecha, así que se quedan

        self.stdout.write('Limpieza completada en store_c')
