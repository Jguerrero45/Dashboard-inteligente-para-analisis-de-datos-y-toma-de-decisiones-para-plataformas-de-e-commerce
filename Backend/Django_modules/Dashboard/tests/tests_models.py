from django.test import TestCase
from Dashboard.models import Clientes, Productos, Ventas, VentaItem
from datetime import date, datetime


class ClientesModelTests(TestCase):
    def test_display_id_sequential(self):
        c1 = Clientes.objects.create(
            nombre='A', apellido='B', cedula='1', ciudad='X', correo='a@b.com', telefono='1', fecha_registro=date(2020, 1, 1), cantidad_compras=0
        )
        self.assertEqual(c1.display_id, 1000)
        c2 = Clientes.objects.create(
            nombre='C', apellido='D', cedula='2', ciudad='Y', correo='c@d.com', telefono='2', fecha_registro=date(2020, 1, 2), cantidad_compras=0
        )
        self.assertEqual(c2.display_id, 1001)


class VentaItemStrTests(TestCase):
    def test_venta_item_str(self):
        cliente = Clientes.objects.create(
            nombre='Cli', apellido='One', cedula='9', ciudad='Z', correo='cli@one.com', telefono='9', fecha_registro=date(2020, 1, 3), cantidad_compras=0
        )
        p = Productos.objects.create(nombre='Prod1', categoria='Cat', precio=10.0, stock=10,
                                     vendidos=0, tendencias=Productos.TENDENCIA_BAJA, estado=Productos.ESTADO_DISPONIBLE)
        v = Ventas.objects.create(fecha=datetime.now(), cliente=cliente, precio_total=0,
                                  metodo_compra=Ventas.METODO_EFECTIVO, estado=Ventas.ESTADO_COMPLETADA)
        vi = VentaItem.objects.create(
            venta=v, producto=p, cantidad=2, precio_unitario=5.00, precio_total=10.00)
        s = str(vi)
        self.assertIn('2 x', s)
        self.assertIn('Prod1', s)
