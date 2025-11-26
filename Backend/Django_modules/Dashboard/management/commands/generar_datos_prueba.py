from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from decimal import Decimal
import random

from faker import Faker

from Dashboard.models import Clientes, Productos, Ventas, VentaItem


class Command(BaseCommand):
    help = "Genera datos de prueba: 100 clientes, 20 productos (6 categorías) y 1000 ventas en el año 2025."

    def add_arguments(self, parser):
        parser.add_argument("--clientes", type=int, default=100,
                            help="Número de clientes a crear")
        parser.add_argument("--productos", type=int, default=100,
                            help="Número de productos a crear")
        parser.add_argument("--ventas", type=int, default=1500,
                            help="Número de ventas a crear")
        parser.add_argument("--seed", type=int, default=None,
                            help="Seed para Faker y random (opcional)")
        parser.add_argument("--clear", action="store_true",
                            help="Eliminar datos existentes antes de generar (Productos, Clientes y Ventas)")

    def handle(self, *args, **options):
        n_clientes = options.get("clientes", 100)
        n_productos = options.get("productos", 100)
        n_ventas = options.get("ventas", 1500)
        seed = options.get("seed")
        clear = options.get("clear")

        fake = Faker()
        if seed is not None:
            Faker.seed(seed)
            random.seed(seed)

        if clear:
            self.stdout.write(
                "Eliminando datos existentes (VentaItems, Ventas, Productos, Clientes)...")
            VentaItem.objects.all().delete()
            Ventas.objects.all().delete()
            Productos.objects.all().delete()
            Clientes.objects.all().delete()

        # 6 categorías fijas
        categorias = [
            "Electrónica",
            "Moda",
            "Hogar",
            "Deportes",
            "Belleza",
            "Alimentos",
        ]

        # Crear clientes
        clientes = []
        telefonos_prefijos = ['424', '414', '422', '412', '416', '426']
        ciudades_venezuela = [
            'Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay',
            'Ciudad Guayana', 'Maturín', 'San Cristóbal', 'Barinas', 'Ciudad Bolívar',
            'Barcelona', 'Cumaná', 'Punto Fijo', 'Cabimas', 'Mérida', 'Puerto La Cruz',
            'Guatire', 'Ciudad Ojeda', 'Coro', 'Turmero', 'Los Teques', 'Guanare',
            'San Felipe', 'Acarigua', 'Carora', 'El Tigre', 'Guarenas', 'Cabudare',
            'Carúpano', 'San Fernando de Apure', 'Guacara', 'Puerto Cabello', 'El Tocuyo',
            'Valera', 'La Victoria', 'Santa Rita', 'Güigüe', 'Anaco', 'Calabozo', 'Quibor',
            'El Vigía', 'Palo Negro', 'San Carlos', 'Mariara', 'Villa de Cura', 'Ocumare del Tuy',
            'Yaritagua', 'Cúa', 'Araure', 'San Juan de los Morros', 'Táriba', 'Guasdualito',
            'Puerto Ayacucho', 'Machiques', 'Cagua', 'Porlamar', 'Charallave', 'La Asunción',
            'Valle de la Pascua', 'Santa Lucía', 'Trujillo', 'Tinaquillo', 'Puerto Píritu',
            'El Limón', 'Socopó', 'Boconó', 'Punta de Mata'
        ]

        # distribuir fecha de registro de clientes a lo largo del 2025
        start_2025_date = datetime(2025, 1, 1).date()
        end_2025_date = datetime(2025, 12, 31).date()

        for _ in range(n_clientes):
            # cantidad de compras y asignación de tipo según reglas
            cantidad_compras = random.randint(0, 50)
            if cantidad_compras == 0:
                tipo_cliente = 'nuevo'
            elif cantidad_compras > 25:
                tipo_cliente = 'vip'
            else:
                tipo_cliente = 'frecuente'

            # cédula formato 00.000.000 con mínimo 1.000.000 y máximo 34.000.000
            num_cedula = random.randint(1_000_000, 34_000_000)
            s = f"{num_cedula:08d}"
            cedula_formateada = f"{s[0:2]}.{s[2:5]}.{s[5:8]}"

            # teléfono formato +58 424 000-00-00
            pref = random.choice(telefonos_prefijos)
            a = random.randint(0, 999)
            b = random.randint(0, 99)
            c = random.randint(0, 99)
            telefono_formateado = f"+58 {pref} {a:03d}-{b:02d}-{c:02d}"

            ciudad = random.choice(ciudades_venezuela)

            c = Clientes(
                nombre=fake.first_name(),
                apellido=fake.last_name(),
                cedula=cedula_formateada,
                ciudad=ciudad,
                correo=fake.unique.email(),
                telefono=telefono_formateado,
                fecha_registro=fake.date_between_dates(
                    date_start=start_2025_date, date_end=end_2025_date),
                cantidad_compras=cantidad_compras,
                tipo_cliente=tipo_cliente,
            )
            clientes.append(c)

        Clientes.objects.bulk_create(clientes, batch_size=500)
        clientes_qs = list(Clientes.objects.all())
        # Verificar y corregir reglas de tipo_cliente (si hay inconsistencias)
        from collections import Counter

        inconsistencias = []
        for c in clientes_qs:
            if c.cantidad_compras == 0 and c.tipo_cliente != 'nuevo':
                c.tipo_cliente = 'nuevo'
                inconsistencias.append(c)
            elif c.tipo_cliente == 'vip' and c.cantidad_compras <= 25:
                # degradar a frecuente si no cumple el umbral
                c.tipo_cliente = 'frecuente'
                inconsistencias.append(c)

        if inconsistencias:
            Clientes.objects.bulk_update(inconsistencias, ['tipo_cliente'])

        clientes_qs = list(Clientes.objects.all())
        counts = Counter([c.tipo_cliente for c in clientes_qs])
        self.stdout.write(self.style.SUCCESS(
            f"Clientes creados: {len(clientes_qs)} | breakdown: {dict(counts)}"))

        # Crear productos distribuidos en 6 categorías con nombres coherentes en español
        productos = []

        # Mapas de ejemplos de productos por categoría (en español)
        ejemplos_por_categoria = {
            'Electrónica': [
                'Teléfono móvil', 'Tablet', 'Laptop', 'Smart TV', 'Auriculares', 'Cámara digital',
                'Cargador inalámbrico', 'Router', 'Disco duro externo', 'Altavoz Bluetooth',
                'Power Bank', 'Monitor', 'Impresora', 'Mouse inalámbrico', 'Teclado mecánico',
                'Smartwatch', 'Proyector', 'Tarjeta SD'
            ],
            'Moda': [
                'Camiseta', 'Pantalones', 'Chaqueta', 'Zapatos deportivos', 'Vestido', 'Falda',
                'Suéter', 'Calcetines', 'Gorra', 'Bolso', 'Cinturón', 'Sandalias', 'Bufanda',
                'Abrigo', 'Jeans', 'Botas', 'Reloj de pulsera'
            ],
            'Hogar': [
                'Juego de sábanas', 'Set de ollas', 'Aspiradora', 'Licuadora', 'Cafetera',
                'Plancha', 'Microondas', 'Lámpara de mesa', 'Mesa auxiliar', 'Colchón',
                'Almohada', 'Toalla', 'Organizador de cocina', 'Cubiertos', 'Jarrón',
                'Estantería', 'Perchero'
            ],
            'Deportes': [
                'Balón de fútbol', 'Balón de baloncesto', 'Raqueta de tenis', 'Cinta de correr',
                'Bicicleta', 'Mancuernas', 'Colchoneta de yoga', 'Casco', 'Guantes de boxeo',
                'Balón de voleibol', 'Zapatillas deportivas', 'Bastones de trekking', 'Pesa rusa',
                'Bandas elásticas', 'Chaleco lastrado'
            ],
            'Belleza': [
                'Crema hidratante', 'Perfume', 'Shampoo', 'Acondicionador', 'Maquillaje',
                'Esmalte de uñas', 'Secador de pelo', 'Plancha de pelo', 'Cepillo facial',
                'Sérum facial', 'Protector solar', 'Mascarilla capilar', 'Desodorante',
                'Tónico facial'
            ],
            'Alimentos': [
                'Café molido', 'Aceite de cocina', 'Arroz', 'Pasta', 'Salsa de tomate',
                'Leche UHT', 'Galletas', 'Mermelada', 'Chocolate', 'Azúcar', 'Harina',
                'Miel', 'Sopa instantánea', 'Frutos secos', 'Avena'
            ],
        }

        # Asegurar mínimo por categoría
        min_por_categoria = 15
        categorias_n = {cat: min_por_categoria for cat in categorias}
        sobrante = max(0, n_productos - sum(categorias_n.values()))
        # distribuir sobrante aleatoriamente entre categorías
        categoria_list = list(categorias)
        for _ in range(sobrante):
            cat_choice = random.choice(categoria_list)
            categorias_n[cat_choice] += 1

        nombres_generados = set()
        for cat, count in categorias_n.items():
            ejemplos = ejemplos_por_categoria.get(cat, [])
            for i in range(count):
                # escoger nombre base y añadir variante (modelo/codigo) para variedad
                base = random.choice(ejemplos)
                variante = fake.lexify(text='-??-###')
                nombre = f"{base} {variante}"
                # evitar duplicados
                if nombre in nombres_generados:
                    nombre = f"{base} {variante}-{i}"
                nombres_generados.add(nombre)

                # precios lógicos por categoría (rangos en USD)
                if cat == 'Electrónica':
                    precio = round(random.uniform(50.0, 2000.0), 2)
                elif cat == 'Moda':
                    precio = round(random.uniform(5.0, 200.0), 2)
                elif cat == 'Hogar':
                    precio = round(random.uniform(10.0, 800.0), 2)
                elif cat == 'Deportes':
                    precio = round(random.uniform(10.0, 600.0), 2)
                elif cat == 'Belleza':
                    precio = round(random.uniform(2.0, 150.0), 2)
                else:  # Alimentos
                    precio = round(random.uniform(1.0, 50.0), 2)

                costo = round(precio * random.uniform(0.3, 0.75), 2)
                utilidad = round(precio - costo, 2)

                # cantidad vendida histórica (para definir tendencia)
                # ahora el máximo de vendidos es 250
                vendidos_count = random.randint(0, 250)
                # tendencias calculadas a partir del máximo (250):
                # alta: >= 70% (>=175), media: >=30% (>=75), baja: <30%
                if vendidos_count >= 175:
                    tendencia = 'alta'
                elif vendidos_count >= 75:
                    tendencia = 'media'
                else:
                    tendencia = 'baja'

                # stock máximo ahora 700
                stock_val = random.randint(0, 700)
                # estado según stock: 0 -> agotado, <50 -> bajo, else disponible
                if stock_val == 0:
                    estado = 'agotado'
                elif stock_val < 50:
                    estado = 'bajo'
                else:
                    estado = 'disponible'

                p = Productos(
                    nombre=nombre,
                    categoria=cat,
                    precio=float(precio),
                    costo=float(costo),
                    utilidad=float(utilidad),
                    stock=stock_val,
                    vendidos=vendidos_count,
                    tendencias=tendencia,
                    estado=estado,
                )
                productos.append(p)

        Productos.objects.bulk_create(productos, batch_size=500)
        productos_qs = list(Productos.objects.all())
        self.stdout.write(self.style.SUCCESS(
            f"Productos creados: {len(productos_qs)}"))

        # Crear ventas dentro del año 2025
        ventas = []
        tz = timezone.get_current_timezone()
        start_2025 = datetime(2025, 1, 1, 0, 0, 0, tzinfo=tz)
        end_2025 = datetime(2025, 12, 31, 23, 59, 59, tzinfo=tz)

        # Crear ventas (cada venta puede contener N items)
        ventas_creadas = 0
        for _ in range(n_ventas):
            fecha_venta = fake.date_time_between_dates(
                datetime_start=start_2025, datetime_end=end_2025, tzinfo=tz)

            cliente = random.choice(clientes_qs)

            # Empezar con 0 total; lo calculamos a partir de los items
            metodo = random.choices(
                ['efectivo', 'tarjeta', 'pago_movil', 'transferencia'],
                weights=[5, 95/3, 95/3, 95/3], k=1
            )[0]
            estado = random.choices(
                ['pendiente', 'completada', 'cancelada', 'reembolsada'],
                weights=[75, 10, 10, 5], k=1
            )[0]

            # crear cabecera de venta sin total (lo actualizaremos)
            v = Ventas.objects.create(
                fecha=fecha_venta,
                cliente=cliente,
                precio_total=Decimal('0.00'),
                metodo_compra=metodo,
                estado=estado,
            )

            # número de ítems por venta (1..5)
            n_items = random.randint(1, 5)
            items_para_venta = []
            total_venta = Decimal('0.00')

            for _i in range(n_items):
                prod = random.choice(productos_qs)
                cantidad = random.randint(1, 5)
                precio_unitario = Decimal(f"{prod.precio:.2f}")
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

            # crear items en bloque para esta venta
            VentaItem.objects.bulk_create(items_para_venta)

            # actualizar total de la venta
            v.precio_total = total_venta.quantize(Decimal('0.01'))
            v.save()

            ventas_creadas += 1

        self.stdout.write(self.style.SUCCESS(
            f"Ventas creadas: {ventas_creadas} (todas en 2025)"))

        self.stdout.write(self.style.SUCCESS(
            "Generación de datos completada."))
