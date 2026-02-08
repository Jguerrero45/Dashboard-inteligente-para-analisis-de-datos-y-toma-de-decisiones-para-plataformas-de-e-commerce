from faker import Faker
from Dashboard.models import Clientes, Productos, Ventas, VentaItem
import os
import django
import sys
from django.utils import timezone
from decimal import Decimal
import random

# Configurar Django
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Django_modules.settings')
django.setup()


fake = Faker('es_ES')
fake.seed_instance(42)

# Obtener un producto existente
producto = Productos.objects.first()
if not producto:
    print("No hay productos, ejecuta generar_datos_prueba primero")
    sys.exit(1)

# Crear 4 clientes con exactamente una compra (4% de 100)
for i in range(4):
    # Crear cliente
    cliente = Clientes.objects.create(
        nombre=fake.first_name(),
        apellido=fake.last_name(),
        cedula=str(fake.unique.random_number(digits=10)),
        ciudad=fake.city(),
        correo=fake.email(),
        telefono=fake.phone_number(),
        prefijos=['424', '414', '422', '412', '426', '416']
        prefijo=random.choice(prefijos)
        telefono=f"+58 {prefijo} {fake.random_number(digits=3):03d} {fake.random_number(digits=2):02d} {fake.random_number(digits=2):02d}",
        fecha_registro=timezone.now().date(),
        cantidad_compras=1,
        tipo_cliente='Regular'
    )

    # Crear una venta completada
    venta = Ventas.objects.create(
        cliente=cliente,
        fecha=timezone.now(),
        precio_total=Decimal('100.00'),
        estado=Ventas.ESTADO_COMPLETADA,
        metodo_compra='Efectivo'
    )

    # Crear item de venta
    VentaItem.objects.create(
        venta=venta,
        producto=producto,
        cantidad=1,
        precio_unitario=producto.precio,
        precio_total=producto.precio
    )

    print(f"Creado cliente {cliente.nombre} con 1 compra")

print("Datos agregados para simular 4% de clientes con una sola compra")
