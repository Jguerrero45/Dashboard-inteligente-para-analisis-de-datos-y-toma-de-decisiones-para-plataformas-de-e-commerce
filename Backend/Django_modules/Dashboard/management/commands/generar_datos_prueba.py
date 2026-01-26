from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from decimal import Decimal
import random
import os

from faker import Faker

from django.conf import settings
from django.core.management import call_command

from Dashboard.models import Clientes, Productos, Ventas, VentaItem


class Command(BaseCommand):
    help = "Genera datos de prueba por alias de BD (usa .using(alias) para cada operación)."

    def add_arguments(self, parser):
        parser.add_argument("--clientes", type=int, default=100,
                            help="Número de clientes base a crear")
        parser.add_argument("--productos", type=int, default=100,
                            help="Número de productos base a crear")
        parser.add_argument("--ventas", type=int, default=1500,
                            help="Número de ventas base a crear")
        parser.add_argument("--seed", type=int, default=None,
                            help="Seed para Faker y random (opcional)")
        parser.add_argument("--clear", action="store_true",
                            help="Eliminar datos existentes antes de generar")
        parser.add_argument("--stores", type=str, default=None,
                            help="Aliases de bases a poblar separados por comas (ej: store_b,store_c)")

    def handle(self, *args, **options):
        n_clientes = options.get("clientes")
        n_productos = options.get("productos")
        n_ventas = options.get("ventas")
        seed = options.get("seed")
        clear = options.get("clear")

        # determinar aliases objetivo: prioridad --stores, env STORES, o primeros 3
        stores_arg = options.get("stores")
        env_stores = os.environ.get('STORES')
        if stores_arg:
            target_aliases = [s.strip()
                              for s in stores_arg.split(',') if s.strip()]
        elif env_stores:
            target_aliases = [s.strip()
                              for s in env_stores.split(',') if s.strip()]
        else:
            target_aliases = list(settings.DATABASES.keys())[:3]

        if seed is not None:
            Faker.seed(seed)
            random.seed(seed)

        multipliers = [1.0, 0.5, 1.67]

        def generate_for_db(db_alias, c_count, p_count, v_count, seed_offset=0, clear_local=False):
            fake = Faker()
            if seed is not None:
                Faker.seed((seed or 0) + seed_offset)
                random.seed((seed or 0) + seed_offset)

            # asegurarse de que las tablas existen
            try:
                _ = Clientes.objects.using(db_alias).exists()
            except Exception:
                try:
                    self.stdout.write(self.style.WARNING(
                        f"Preparando DB '{db_alias}' con migraciones"))
                    call_command('migrate', database=db_alias,
                                 interactive=False, verbosity=0)
                except Exception as exc:
                    self.stdout.write(self.style.ERROR(
                        f"No se pudo preparar la DB '{db_alias}': {exc}"))
                    return 0, 0, 0
            n_items = random.choices([1, 2, 3, 4, 5, 6], weights=[
                                     30, 30, 18, 12, 7, 3])[0]
            items_para_venta = []
            total_venta = Decimal('0.00')

            # seleccionar productos por peso (sin reemplazo dentro de la misma venta si es posible)
            available_products = [
                p for p in productos_qs if prod_stock.get(p.pk, 0) > 0]
            # si no hay suficientes disponibles, usar todos y permitir repetidos
            if len(available_products) >= n_items:
                choices = random.choices(
                    population=available_products,
                    weights=[product_weights[productos_qs.index(
                        p)] for p in available_products],
                    k=n_items
                )
            else:
                # fallback: elegir con reemplazo desde todos los productos usando product_weights
                choices = random.choices(
                    population=productos_qs, weights=product_weights, k=n_items)

            for _i, prod in enumerate(choices):
                # cantidad depende de la categoría: alimentos tienden a comprar mayores cantidades
                if prod.categoria == 'Alimentos':
                    cantidad = random.choices([1, 2, 3, 4, 5, 6, 8, 10], weights=[
                                              20, 18, 15, 12, 10, 10, 8, 7])[0]
                elif prod.categoria == 'Electrónica':
                    cantidad = random.choices(
                        [1, 1, 1, 2], weights=[70, 20, 10, 0])[0]
                elif prod.categoria == 'Moda':
                    cantidad = random.choices(
                        [1, 1, 2, 3], weights=[60, 25, 10, 5])[0]
                else:
                    cantidad = random.randint(1, 4)

                # respetar stock disponible
                available = prod_stock.get(prod.pk, 0)
                if available <= 0:
                    # artículo agotado, reducir impacto (saltar item)
                    continue
                cantidad = min(cantidad, available)

                precio_unitario = Decimal(f"{prod.precio:.2f}")
                # añadir pequeñas fluctuaciones al precio unitario para realismo
                fluct = Decimal(
                    str(round(random.uniform(-0.03, 0.05) * float(precio_unitario), 2)))
                precio_unitario = (precio_unitario +
                                   fluct).quantize(Decimal('0.01'))
                total_item = (precio_unitario *
                              cantidad).quantize(Decimal('0.01'))

                item = VentaItem(
                    venta=v,
                    producto=prod,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    precio_total=total_item,
                )
                items_para_venta.append(item)
                total_venta += total_item

                # actualizar contadores locales
                prod_sold_counts[prod.pk] = prod_sold_counts.get(
                    prod.pk, 0) + cantidad
                prod_stock[prod.pk] = max(
                    0, prod_stock.get(prod.pk, 0) - cantidad)
                # si producto se agota, reducir su peso futuro
                if prod_stock[prod.pk] == 0:
                    idx = productos_qs.index(prod)
                    product_weights[idx] *= 0.02

            # crear items en bloque para esta venta
            VentaItem.objects.bulk_create(items_para_venta)

            # actualizar total de la venta
            v.precio_total = total_venta.quantize(Decimal('0.01'))
            v.save()

            ventas_creadas += 1

        self.stdout.write(self.style.SUCCESS(
            f"Ventas creadas: {ventas_creadas} (periodo 2025-01-01 a 2026-01-31)"))

        # Actualizar Productos con los nuevos contadores de stock y vendidos
        productos_a_actualizar = []
        for p in productos_qs:
            pk = p.pk
            nuevos_vendidos = prod_sold_counts.get(
                pk, int(getattr(p, 'vendidos', 0) or 0))
            nuevo_stock = prod_stock.get(pk, int(getattr(p, 'stock', 0) or 0))
            p.vendidos = nuevos_vendidos
            p.stock = nuevo_stock
            # recalcular tendencia de ventas de forma no simétrica
            if nuevos_vendidos >= 200:
                p.tendencias = 'alta'
            elif nuevos_vendidos >= 75:
                p.tendencias = 'media'
            else:
                p.tendencias = 'baja'
            if p.stock == 0:
                p.estado = 'agotado'
            elif p.stock < 50:
                p.estado = 'bajo'
            else:
                p.estado = 'disponible'
            productos_a_actualizar.append(p)

        Productos.objects.bulk_update(productos_a_actualizar, [
                                      'vendidos', 'stock', 'tendencias', 'estado'])

        self.stdout.write(self.style.SUCCESS(
            "Generación de datos completada."))
