from django.core.management.base import BaseCommand
from django.conf import settings
from Dashboard.models import Clientes, Productos, Ventas, VentaItem
import random


class Command(BaseCommand):
    help = "Ajusta los datos de prueba existentes: estados de ventas, clientes, productos y precios."

    def handle(self, *args, **options):
        target_aliases = list(settings.DATABASES.keys())[:3]

        for db_alias in target_aliases:
            self.stdout.write(f"Ajustando datos en {db_alias}...")

            # Ajustar estados de ventas
            ventas = Ventas.objects.using(db_alias).all()
            total_ventas = ventas.count()
            canceladas = int(total_ventas * 0.06)
            pendientes = int(total_ventas * 0.14)
            completadas = total_ventas - canceladas - pendientes

            # Asignar estados
            ventas_list = list(ventas)
            random.shuffle(ventas_list)

            for i, venta in enumerate(ventas_list):
                if i < canceladas:
                    venta.estado = 'cancelada'
                elif i < canceladas + pendientes:
                    venta.estado = 'pendiente'
                else:
                    venta.estado = 'completada'
                venta.save(using=db_alias)

            self.stdout.write(self.style.SUCCESS(
                f"  Ventas: {completadas} completadas, {pendientes} pendientes, {canceladas} canceladas"))

            # Ajustar tipo_cliente de clientes (asumiendo 'frecuente' como 'activo')
            clientes = Clientes.objects.using(db_alias).all()
            total_clientes = clientes.count()
            activos = int(total_clientes * 0.98)
            otros = total_clientes - activos

            clientes_list = list(clientes)
            random.shuffle(clientes_list)

            for i, cliente in enumerate(clientes_list):
                if i < activos:
                    cliente.tipo_cliente = 'frecuente'
                else:
                    cliente.tipo_cliente = random.choice(['nuevo', 'vip'])
                cliente.save(using=db_alias)

            self.stdout.write(self.style.SUCCESS(
                f"  Clientes: {activos} frecuentes, {otros} otros"))

            # Ajustar estados y precios de productos
            productos = Productos.objects.using(db_alias).all()
            total_productos = productos.count()
            agotados = int(total_productos * 0.04)
            bajos = int(total_productos * 0.16)
            disponibles = total_productos - agotados - bajos

            productos_list = list(productos)
            random.shuffle(productos_list)

            precios_nuevos = {
                'alimentos': (1, 10),
                'belleza': (5, 50),
                'hogar': (10, 100),
                'electronica': (3, 400),
                'deporte': (10, 200),
                'moda': (5, 50),
            }

            for i, producto in enumerate(productos_list):
                # Ajustar precio
                min_p, max_p = precios_nuevos.get(
                    producto.categoria, (1000, 10000))
                producto.precio = round(random.uniform(min_p, max_p), 2)

                # Ajustar estado
                if i < agotados:
                    producto.estado = 'agotado'
                    producto.stock = 0
                elif i < agotados + bajos:
                    producto.estado = 'bajo'
                    producto.stock = random.randint(1, 49)
                else:
                    producto.estado = 'disponible'
                    producto.stock = random.randint(50, 500)

                producto.save(using=db_alias)

            self.stdout.write(self.style.SUCCESS(
                f"  Productos: {disponibles} disponibles, {bajos} bajos, {agotados} agotados"))

            # Actualizar precios en VentaItem y Ventas
            venta_items = VentaItem.objects.using(
                db_alias).select_related('venta', 'producto')
            for item in venta_items:
                item.precio_unitario = item.producto.precio
                item.precio_total = item.precio_unitario * item.cantidad
                item.save(using=db_alias)

            # Actualizar precio_total de Ventas
            for venta in Ventas.objects.using(db_alias).prefetch_related('items'):
                total = sum(item.precio_total for item in venta.items.all())
                venta.precio_total = total
                venta.save(using=db_alias)

            self.stdout.write(self.style.SUCCESS(
                "  Precios en ventas actualizados"))

        self.stdout.write(self.style.SUCCESS(
            "Ajuste de datos completado en todas las DBs."))
