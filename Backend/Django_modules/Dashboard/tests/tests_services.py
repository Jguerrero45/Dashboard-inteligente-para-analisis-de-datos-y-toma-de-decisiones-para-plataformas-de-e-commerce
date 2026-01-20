from django.test import TestCase
from Dashboard.services import gemini_client as gc
from Dashboard.models import Productos, Ventas, VentaItem, Clientes
from django.utils import timezone
from datetime import timedelta


class GeminiClientTests(TestCase):
    def test_build_structured_monthly_empty(self):
        out = gc.build_structured_monthly(metric='revenue', n_months=1)
        self.assertIn('items', out)
        self.assertEqual(out['dimension'], 'month')

    def test_generate_ai_recommendation_no_products_raises(self):
        with self.assertRaises(gc.GeminiError):
            gc.generate_ai_recommendation(product_ids=[999999])

    def test_build_structured_by_product_basic(self):
        # Crear cliente, venta y ventaitem
        cliente = Clientes.objects.create(nombre='C', apellido='D', cedula='10', ciudad='X',
                                          correo='c@d', telefono='1', fecha_registro=timezone.now().date(), cantidad_compras=1)
        p = Productos.objects.create(nombre='ProdSvc', categoria='Cat', precio=10.0, stock=5,
                                     vendidos=1, tendencias=Productos.TENDENCIA_MEDIA, estado=Productos.ESTADO_DISPONIBLE)
        v = Ventas.objects.create(fecha=timezone.now(), cliente=cliente, precio_total=10.0,
                                  metodo_compra=Ventas.METODO_EFECTIVO, estado=Ventas.ESTADO_COMPLETADA)
        VentaItem.objects.create(
            venta=v, producto=p, cantidad=1, precio_unitario=10.0, precio_total=10.0)
        out = gc.build_structured_by_product(metric='revenue', days=30)
        self.assertEqual(out['dimension'], 'product')
        self.assertIn('items', out)
