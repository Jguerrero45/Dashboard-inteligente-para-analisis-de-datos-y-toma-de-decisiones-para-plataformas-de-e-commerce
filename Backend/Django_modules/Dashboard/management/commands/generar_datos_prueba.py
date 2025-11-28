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

        # Crear clientes con distribución controlada
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

        # calcular cantidades por segmento: 15% vip, 10% nuevo, resto frecuentes
        n_vip = int(round(n_clientes * 0.15))
        n_nuevo = int(round(n_clientes * 0.10))
        n_frecuente = max(0, n_clientes - n_vip - n_nuevo)

        clientes_info = []
        for _ in range(n_vip):
            clientes_info.append(('vip', random.randint(51, 200)))
        for _ in range(n_nuevo):
            clientes_info.append(('nuevo', random.randint(0, 5)))
        for _ in range(n_frecuente):
            clientes_info.append(('frecuente', random.randint(6, 50)))

        random.shuffle(clientes_info)

        for tipo_cliente, cantidad_compras in clientes_info:
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
        from collections import Counter
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
        # Preparar distribución de stock globalmente para cumplir porcentajes
        total_productos = sum(categorias_n.values())
        n_no_stock = int(round(total_productos * 0.06))  # 6% sin stock
        n_bajo = int(round(total_productos * 0.15))      # 15% bajo en stock
        n_rest = max(0, total_productos - n_no_stock - n_bajo)

        stock_values = []
        # no stock
        stock_values += [0] * n_no_stock
        # bajo stock: 1..49
        stock_values += [random.randint(1, 49) for _ in range(n_bajo)]
        # stock normal: 50..700
        stock_values += [random.randint(50, 700) for _ in range(n_rest)]
        random.shuffle(stock_values)

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

                # costo y utilidad se omiten: fueron removidos del modelo

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

                # tomar un valor de stock precomputado para cumplir proporciones
                stock_val = stock_values.pop() if stock_values else random.randint(0, 700)
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
                    # costo/utilidad removidos
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
            # Estados de venta: 70% completada, 20% pendiente, 10% cancelada
            estado = random.choices(
                ['completada', 'pendiente', 'cancelada'],
                weights=[70, 20, 10], k=1
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
