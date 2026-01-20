from django.test import TestCase
from Dashboard.serializer import Clientes_Serializers, Productos_Serializers
from Dashboard.models import Clientes, Productos
from django.utils import timezone
from datetime import date


class SerializersTests(TestCase):
    def test_clientes_estado_activo_inactivo(self):
        cliente = Clientes.objects.create(
            nombre='A', apellido='B', cedula='1', ciudad='X', correo='a@b', telefono='1', fecha_registro=date(2020, 1, 1), cantidad_compras=1
        )
        ser = Clientes_Serializers(cliente)
        self.assertEqual(ser.data['estado'], 'inactivo')

        # Simular atributo anotado ultima_compra reciente
        cliente.ultima_compra = timezone.now()
        ser2 = Clientes_Serializers(cliente)
        self.assertEqual(ser2.data['estado'], 'activo')

    def test_productos_estado_por_stock(self):
        p = Productos.objects.create(nombre='P', categoria='C', precio=10.0, stock=0, vendidos=0,
                                     tendencias=Productos.TENDENCIA_BAJA, estado=Productos.ESTADO_DISPONIBLE)
        ser = Productos_Serializers(p)
        self.assertEqual(ser.data['estado'], 'agotado')
        p.stock = 10
        ser = Productos_Serializers(p)
        self.assertEqual(ser.data['estado'], 'bajo-stock')
        p.stock = 100
        ser = Productos_Serializers(p)
        self.assertEqual(ser.data['estado'], 'activo')
