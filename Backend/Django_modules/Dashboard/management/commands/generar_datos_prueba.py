from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from decimal import Decimal
import random
import os

from faker import Faker

from django.conf import settings
from django.core.management import call_command

from Dashboard.models import Clientes, Productos, Ventas, VentaItem, ModeloPrediccion, EntradaPrediccion, RecomendacionIA, Tasa, Store, UserProfile


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

        # Diccionarios de productos por categoría
        productos_por_categoria = {
            'alimentos': ['Arroz', 'Harina', 'Azúcar', 'Café', 'Pasta', 'Aceite', 'Leche', 'Queso', 'Carne', 'Pollo', 'Huevos', 'Pan', 'Frutas', 'Verduras', 'Cereal', 'Galletas', 'Chocolate', 'Yogurt', 'Mantequilla', 'Salsa'],
            'belleza': ['Shampoo', 'Jabón', 'Crema', 'Perfume', 'Maquillaje', 'Cepillo', 'Pasta dental', 'Desodorante', 'Loción', 'Máscara', 'Labial', 'Base', 'Polvos', 'Esmalte', 'Cepillo de dientes', 'Enjuague', 'Crema de afeitar', 'Aftershave', 'Aceite esencial', 'Mascarilla'],
            'hogar': ['Detergente', 'Jabón para platos', 'Limpiador', 'Esponja', 'Papel higiénico', 'Servilletas', 'Bolsas de basura', 'Velas', 'Almohadas', 'Sábanas', 'Toallas', 'Cortinas', 'Platos', 'Vasos', 'Cubiertos', 'Ollas', 'Sartenes', 'Refrigerador', 'Lavadora', 'Aspiradora'],
            'electronica': ['Teléfono', 'Computadora', 'Tablet', 'Televisor', 'Audífonos', 'Cargador', 'Batería', 'Cable USB', 'Mouse', 'Teclado', 'Impresora', 'Cámara', 'Consola', 'Smartwatch', 'Router', 'Disco duro', 'Memoria USB', 'Altavoz', 'Micrófono', 'Proyector'],
            'deporte': ['Pelota', 'Raqueta', 'Bicicleta', 'Pesas', 'Colchoneta', 'Cuerda', 'Guantes', 'Zapatillas', 'Camiseta', 'Pantalones', 'Chaqueta', 'Gorra', 'Botella', 'Reloj', 'Casco', 'Protector', 'Red', 'Portería', 'Cancha', 'Entrenador'],
            'moda': ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Zapatos', 'Bolso', 'Sombrero', 'Bufanda', 'Guantes', 'Calcetines', 'Ropa interior', 'Traje', 'Blusa', 'Chaqueta', 'Jeans', 'Shorts', 'Sudadera', 'Abrigo', 'Gafas', 'Joyas']
        }

        categorias = list(productos_por_categoria.keys())

        ciudades_venezolanas = ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Barcelona', 'Maturín', 'Puerto La Cruz',
                                'Santa Teresa del Tuy', 'Cúa', 'Charallave', 'San Antonio de los Altos', 'Los Teques', 'Guatire', 'Guarenas', 'Petare', 'Chacao', 'El Hatillo', 'Baruta']

        periods_data_default = {
            2022: {'factor': 0.6, 'end': datetime(2022, 12, 31)},
            2023: {'factor': 0.7, 'end': datetime(2023, 12, 31)},
            2024: {'factor': 0.8, 'end': datetime(2024, 12, 31)},
            2025: {'factor': 1.0, 'end': datetime(2025, 12, 31)},
            2026: {'factor': 0.8, 'end': datetime(2026, 12, 31)},
        }

        periods_data_store_c = {
            'plan_2026': {'factor': 0.1, 'start': datetime(2026, 1, 1), 'end': datetime(2026, 12, 31)},
        }

        def generate_for_db(db_alias, c_count, p_count, n_ventas, periods_data, seed=None, clear_local=False):
            fake = Faker('es')  # Datos en español
            # Prefijos telefónicos venezolanos
            prefijos = ['424', '414', '422', '412', '426', '416']
            if seed is not None:
                Faker.seed(seed)
                random.seed(seed)

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

            if clear_local:
                # Eliminar en orden inverso de dependencias
                RecomendacionIA.objects.using(db_alias).all().delete()
                EntradaPrediccion.objects.using(db_alias).all().delete()
                ModeloPrediccion.objects.using(db_alias).all().delete()
                Ventas.objects.using(db_alias).all().delete()
                VentaItem.objects.using(db_alias).all().delete()
                Clientes.objects.using(db_alias).all().delete()
                Productos.objects.using(db_alias).all().delete()
                Tasa.objects.using(db_alias).all().delete()
                Store.objects.using(db_alias).all().delete()
                UserProfile.objects.using(db_alias).all().delete()

            # Crear clientes
            clientes = []
            for i in range(c_count):
                prefijo = random.choice(prefijos)
                cliente = Clientes.objects.using(db_alias).create(
                    nombre=fake.first_name(),
                    apellido=fake.last_name(),
                    correo=fake.email(),
                    telefono=f"+58 {prefijo} {fake.random_number(digits=3):03d} {fake.random_number(digits=2):02d} {fake.random_number(digits=2):02d}",
                    # Cédula venezolana 8 dígitos
                    cedula=str(fake.unique.random_number(digits=8)),
                    ciudad=random.choice(ciudades_venezolanas),
                    fecha_registro=timezone.now().date(),
                    cantidad_compras=0,
                    tipo_cliente=random.choice(['nuevo', 'frecuente', 'vip']),
                    display_id=1000 + i,  # Asignar display_id único
                )
                clientes.append(cliente)

            # Crear productos
            productos = []
            for i in range(p_count):
                categoria = random.choice(categorias)
                nombre = random.choice(productos_por_categoria[categoria])
                # Precios en USD
                if categoria == 'alimentos':
                    precio = round(random.uniform(1, 10), 2)  # USD
                elif categoria == 'belleza':
                    precio = round(random.uniform(5, 50), 2)
                elif categoria == 'hogar':
                    precio = round(random.uniform(10, 100), 2)
                elif categoria == 'electronica':
                    precio = round(random.uniform(3, 400), 2)
                elif categoria == 'deporte':
                    precio = round(random.uniform(10, 200), 2)
                else:  # moda
                    precio = round(random.uniform(5, 50), 2)
                stock = random.randint(50, 500)
                producto = Productos.objects.using(db_alias).create(
                    nombre=nombre,
                    precio=precio,
                    categoria=categoria,
                    stock=stock,
                    estado='disponible',
                    tendencias='baja',
                    vendidos=0,
                )
                productos.append(producto)

            productos_qs = productos
            prod_stock = {p.pk: p.stock for p in productos}
            prod_sold_counts = {p.pk: 0 for p in productos}
            product_weights = [1.0] * len(productos)
            ventas_creadas = 0

            # Loop de periodos
            for period, data in periods_data.items():
                start_date = data.get('start', datetime(period, 1, 1)) if isinstance(
                    period, int) else data['start']
                end_date = data['end']
                v_count_period = int(n_ventas * data['factor'])
                if seed is not None:
                    Faker.seed((seed or 0) +
                               (period if isinstance(period, int) else 0))
                    random.seed(
                        (seed or 0) + (period if isinstance(period, int) else 0))
                for i in range(v_count_period):
                    cliente = random.choice(clientes)
                    fecha = fake.date_time_between(
                        start_date=start_date, end_date=end_date)
                    metodo_compra = random.choice(
                        ['efectivo', 'tarjeta', 'transferencia'])
                    v = Ventas.objects.using(db_alias).create(
                        cliente=cliente,
                        fecha=fecha,
                        metodo_compra=metodo_compra,
                        precio_total=Decimal('0.00'),
                    )

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
                        if prod.categoria == 'alimentos':
                            cantidad = random.choices([1, 2, 3, 4, 5, 6, 8, 10], weights=[
                                                      20, 18, 15, 12, 10, 10, 8, 7])[0]
                        elif prod.categoria == 'electronica':
                            cantidad = random.choices(
                                [1, 1, 1, 2], weights=[70, 20, 10, 0])[0]
                        elif prod.categoria == 'moda':
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

                    # crear items individualmente para esta venta
                    for item in items_para_venta:
                        item.save(using=db_alias)

                    # actualizar total de la venta
                    v.precio_total = total_venta.quantize(Decimal('0.01'))
                    v.save()

                    ventas_creadas += 1

            self.stdout.write(self.style.SUCCESS(
                f"Ventas creadas: {ventas_creadas} para {db_alias}"))

            # Actualizar Productos con los nuevos contadores de stock y vendidos
            productos_a_actualizar = []
            for p in productos_qs:
                pk = p.pk
                nuevos_vendidos = prod_sold_counts.get(
                    pk, int(getattr(p, 'vendidos', 0) or 0))
                nuevo_stock = prod_stock.get(
                    pk, int(getattr(p, 'stock', 0) or 0))
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

            Productos.objects.using(db_alias).bulk_update(productos_a_actualizar, [
                'vendidos', 'stock', 'tendencias', 'estado'])

        for i, db_alias in enumerate(target_aliases):
            c_count = int(n_clientes * multipliers[i % len(multipliers)])
            p_count = int(n_productos * multipliers[i % len(multipliers)])
            if db_alias == 'store_c':
                periods_data = periods_data_store_c
            else:
                periods_data = periods_data_default
            generate_for_db(db_alias, c_count, p_count,
                            n_ventas, periods_data, seed, clear)

        self.stdout.write(self.style.SUCCESS(
            "Generación de datos completada."))
