from django.core.management.base import BaseCommand
from django.conf import settings
from Dashboard.models import Clientes, Productos, Ventas, VentaItem
import random
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal


class Command(BaseCommand):
    help = "Genera datos históricos para años anteriores y ajusta ventas en enero 2026."

    def handle(self, *args, **options):
        target_aliases = list(settings.DATABASES.keys())[:3]

        for db_alias in target_aliases:
            self.stdout.write(f"Generando datos históricos en {db_alias}...")

            # Obtener ventas de 2026
            ventas_2026 = Ventas.objects.using(
                db_alias).filter(fecha__year=2026)
            if not ventas_2026.exists():
                self.stdout.write(self.style.WARNING(
                    "No hay ventas en 2026 para copiar."))
                continue

            # Generar datos para 2025 y 2024
            for year in [2025, 2024]:
                self.stdout.write(f"  Generando datos para {year}...")
                for venta in ventas_2026:
                    # Copiar venta con fecha en el año anterior
                    nueva_fecha = venta.fecha.replace(year=year)
                    # Reducir precio_total en un 20-50% para años anteriores
                    factor_reduccion = Decimal(random.uniform(0.5, 0.8))
                    nuevo_precio_total = venta.precio_total * factor_reduccion

                    nueva_venta = Ventas.objects.using(db_alias).create(
                        cliente=venta.cliente,
                        fecha=nueva_fecha,
                        precio_total=nuevo_precio_total,
                        metodo_compra=venta.metodo_compra,
                        estado=venta.estado
                    )

                    # Copiar items de venta, ajustando precios
                    for item in venta.items.all():
                        nuevo_precio_unitario = item.precio_unitario * factor_reduccion
                        nuevo_precio_total_item = nuevo_precio_unitario * item.cantidad
                        VentaItem.objects.using(db_alias).create(
                            venta=nueva_venta,
                            producto=item.producto,
                            cantidad=item.cantidad,
                            precio_unitario=nuevo_precio_unitario,
                            precio_total=nuevo_precio_total_item
                        )

            self.stdout.write(self.style.SUCCESS(
                f"  Datos generados para 2025 y 2024."))

            # Ajustar ventas por mes para simular patrones realistas
            month_factors = {
                1: Decimal('0.5'),  # Enero - valor normal
                2: Decimal('0.5'),  # Febrero - valor normal
                3: Decimal('0.2'),  # Marzo - subir un poco
                4: Decimal('0.3'),  # Abril
                5: Decimal('0.4'),  # Mayo
                6: Decimal('0.5'),  # Junio
                7: Decimal('0.6'),  # Julio
                8: Decimal('0.7'),  # Agosto
                9: Decimal('0.6'),  # Septiembre
                10: Decimal('0.7'),  # Octubre
                11: Decimal('0.8'),  # Noviembre
                12: Decimal('0.9'),  # Diciembre - max 83k
            }
            for year in [2024, 2025, 2026]:
                for month, factor in month_factors.items():
                    ventas_mes = Ventas.objects.using(db_alias).filter(
                        fecha__year=year, fecha__month=month)
                    if ventas_mes.exists():
                        self.stdout.write(
                            f"  Ajustando {ventas_mes.count()} ventas en {month}/{year} con factor {factor}...")
                        for venta in ventas_mes:
                            venta.precio_total *= factor
                            venta.save(using=db_alias)
                            for item in venta.items.all():
                                item.precio_unitario *= factor
                                item.precio_total = item.precio_unitario * item.cantidad
                                item.save(using=db_alias)

            self.stdout.write(self.style.SUCCESS(
                "  Ventas ajustadas por mes para todos los años."))

            # Ajustar cantidades en VentaItem: reducir total a 5543, máximo 4 por item
            from django.db.models import Sum
            total_unidades_actual = VentaItem.objects.using(
                db_alias).aggregate(Sum('cantidad'))['cantidad__sum'] or 0
            factor_cantidad = Decimal(
                '5543') / Decimal(total_unidades_actual) if total_unidades_actual > 0 else Decimal('1')
            self.stdout.write(
                f"  Total unidades actual: {total_unidades_actual}, aplicando factor {factor_cantidad}")
            for item in VentaItem.objects.using(db_alias).all():
                nueva_cantidad = min(
                    max(1, int(item.cantidad * factor_cantidad)), 5)
                item.cantidad = nueva_cantidad
                item.precio_total = item.precio_unitario * nueva_cantidad
                item.save(using=db_alias)

            # Actualizar precio_total de Ventas después de ajustar items
            for venta in Ventas.objects.using(db_alias).prefetch_related('items'):
                venta.precio_total = sum(
                    item.precio_total for item in venta.items.all())
                venta.save(using=db_alias)

            self.stdout.write(self.style.SUCCESS(
                "  Cantidades ajustadas, máximo 5 por item, total ~5543."))

        self.stdout.write(self.style.SUCCESS(
            "Generación de datos históricos completada."))
