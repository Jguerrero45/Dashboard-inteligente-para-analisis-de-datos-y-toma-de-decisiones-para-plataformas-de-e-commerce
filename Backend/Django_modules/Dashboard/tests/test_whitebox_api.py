from django.test import TestCase
from rest_framework.test import APIClient
from Dashboard.models import Clientes, Productos, Ventas, VentaItem
from django.utils import timezone
from datetime import timedelta
import io
from decimal import Decimal


class WhiteBoxAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_prueba1_venta_multi_item_y_consultas_anotadas(self):
        # Crear cliente
        cliente = Clientes.objects.create(
            nombre='WB', apellido='Cliente', cedula='WB1', ciudad='Ciudad', correo='wb@local', telefono='000', fecha_registro=timezone.now().date(), cantidad_compras=0
        )
        # Crear productos
        p1 = Productos.objects.create(nombre='WBProd1', categoria='CatA', precio=10.0, costo=Decimal(
            '4.00'), stock=100, vendidos=0, tendencias=Productos.TENDENCIA_MEDIA, estado=Productos.ESTADO_DISPONIBLE)
        p2 = Productos.objects.create(nombre='WBProd2', categoria='CatA', precio=20.0, costo=Decimal(
            '8.00'), stock=50, vendidos=0, tendencias=Productos.TENDENCIA_MEDIA, estado=Productos.ESTADO_DISPONIBLE)
        # Crear venta completada con items
        v = Ventas.objects.create(fecha=timezone.now(), cliente=cliente, precio_total=0,
                                  metodo_compra=Ventas.METODO_EFECTIVO, estado=Ventas.ESTADO_COMPLETADA)
        vi1 = VentaItem.objects.create(
            venta=v, producto=p1, cantidad=2, precio_unitario=10.0, precio_total=20.0)
        vi2 = VentaItem.objects.create(
            venta=v, producto=p2, cantidad=1, precio_unitario=20.0, precio_total=20.0)
        # Actualizamos precio_total de la venta a suma de items
        total = vi1.precio_total + vi2.precio_total
        v.precio_total = total
        v.save()

        # Verificar suma items == Venta.precio_total
        self.assertEqual(float(v.precio_total), float(total))

        # Consultar endpoint de clientes y verificar anotaciones (compras, gasto_total)
        resp = self.client.get('/api/Clientes/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Buscar nuestro cliente
        found = None
        for it in data:
            if it.get('cedula') == cliente.cedula:
                found = it
                break
        self.assertIsNotNone(found, 'Cliente no encontrado en listado')
        # Compras y gasto_total deberían reflejar la venta creada
        self.assertTrue(int(found.get('compras', 0)) >= 1)
        # gasto_total puede ser None o número; convertir y comparar aproximado
        gasto_total = float(found.get('gasto_total') or 0)
        self.assertAlmostEqual(gasto_total, float(total), places=2)

    def test_prueba2_products_growth_view(self):
        # Crear cliente y producto
        cliente = Clientes.objects.create(nombre='G1', apellido='Test', cedula='G-1', ciudad='X',
                                          correo='g1@t', telefono='1', fecha_registro=timezone.now().date(), cantidad_compras=0)
        p = Productos.objects.create(nombre='GrowthProd', categoria='CatG', precio=10.0, costo=Decimal(
            '3.00'), stock=20, vendidos=0, tendencias=Productos.TENDENCIA_MEDIA, estado=Productos.ESTADO_DISPONIBLE)

        now = timezone.now()
        # Venta en periodo previo (40 days ago -> in prev window if days=30)
        v_prev = Ventas.objects.create(fecha=now - timedelta(days=40), cliente=cliente, precio_total=50.0,
                                       metodo_compra=Ventas.METODO_EFECTIVO, estado=Ventas.ESTADO_COMPLETADA)
        VentaItem.objects.create(
            venta=v_prev, producto=p, cantidad=2, precio_unitario=10.0, precio_total=20.0)
        # Venta en periodo actual (10 days ago)
        v_now = Ventas.objects.create(fecha=now - timedelta(days=10), cliente=cliente, precio_total=80.0,
                                      metodo_compra=Ventas.METODO_EFECTIVO, estado=Ventas.ESTADO_COMPLETADA)
        VentaItem.objects.create(
            venta=v_now, producto=p, cantidad=6, precio_unitario=10.0, precio_total=60.0)

        # Llamar al endpoint
        resp = self.client.get(
            '/api/metrics/products-growth/?days=30&limit=10')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Debe contener al menos un resultado con product id del producto creado
        self.assertTrue(isinstance(data, list))
        # Encontrar la fila correspondiente
        found = None
        for r in data:
            if r.get('producto_id') == p.id:
                found = r
                break
        self.assertIsNotNone(
            found, 'Producto no encontrado en products-growth')
        # growth_pct calculado: prev revenue was 20, now 60 -> ((60-20)/20)*100 = 200%
        self.assertAlmostEqual(found.get('revenue_now'),
                               round(60.0, 2), places=2)
        self.assertAlmostEqual(found.get('revenue_prev'),
                               round(20.0, 2), places=2)
        self.assertAlmostEqual(found.get('growth_pct'), round(
            ((60.0 - 20.0) / 20.0) * 100, 1), places=1)

    def test_prueba3_revenue_by_category(self):
        cliente = Clientes.objects.create(nombre='R1', apellido='Test', cedula='R-1', ciudad='X',
                                          correo='r1@t', telefono='1', fecha_registro=timezone.now().date(), cantidad_compras=0)
        p1 = Productos.objects.create(nombre='CatProd1', categoria='CatX', precio=15.0, costo=Decimal(
            '5.00'), stock=10, vendidos=0, tendencias=Productos.TENDENCIA_MEDIA, estado=Productos.ESTADO_DISPONIBLE)
        p2 = Productos.objects.create(nombre='CatProd2', categoria='CatY', precio=20.0, costo=Decimal(
            '8.00'), stock=5, vendidos=0, tendencias=Productos.TENDENCIA_MEDIA, estado=Productos.ESTADO_DISPONIBLE)

        v = Ventas.objects.create(fecha=timezone.now(), cliente=cliente, precio_total=0,
                                  metodo_compra=Ventas.METODO_EFECTIVO, estado=Ventas.ESTADO_COMPLETADA)
        VentaItem.objects.create(
            venta=v, producto=p1, cantidad=2, precio_unitario=15.0, precio_total=30.0)
        VentaItem.objects.create(
            venta=v, producto=p2, cantidad=1, precio_unitario=20.0, precio_total=20.0)

        resp = self.client.get('/api/metrics/revenue-by-category/?days=30')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Buscar categoría CatX
        found_x = next(
            (it for it in data if it.get('category') == 'CatX'), None)
        found_y = next(
            (it for it in data if it.get('category') == 'CatY'), None)
        self.assertIsNotNone(found_x)
        self.assertIsNotNone(found_y)
        # revenue y cost
        self.assertAlmostEqual(found_x.get('revenue'), 30.0, places=2)
        # cost = sum(cantidad * producto.costo) = 2 * 5 = 10
        self.assertAlmostEqual(found_x.get('cost'), 10.0, places=2)

    def test_prueba4_clientes_estado_segmento(self):
        # Cliente con ultima compra reciente -> activo
        c1 = Clientes.objects.create(nombre='Seg1', apellido='A', cedula='S1', ciudad='X',
                                     correo='s1@t', telefono='1', fecha_registro=timezone.now().date(), cantidad_compras=2)
        # Cliente con muchas compras -> vip
        c2 = Clientes.objects.create(nombre='Seg2', apellido='B', cedula='S2', ciudad='Y',
                                     correo='s2@t', telefono='2', fecha_registro=timezone.now().date(), cantidad_compras=60)

        # Añadir venta reciente para c1
        v1 = Ventas.objects.create(fecha=timezone.now(), cliente=c1, precio_total=10.0,
                                   metodo_compra=Ventas.METODO_EFECTIVO, estado=Ventas.ESTADO_COMPLETADA)
        VentaItem.objects.create(venta=v1, producto=Productos.objects.create(nombre='Tmp1', categoria='C', precio=5.0, costo=Decimal(
            '1.00'), stock=1, vendidos=0, tendencias=Productos.TENDENCIA_BAJA, estado=Productos.ESTADO_DISPONIBLE), cantidad=1, precio_unitario=5.0, precio_total=5.0)

        resp = self.client.get('/api/Clientes/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # localizar clientes y validar segmento
        mapping = {it.get('cedula'): it for it in data}
        self.assertIn('S1', mapping)
        self.assertIn('S2', mapping)
        self.assertEqual(mapping['S1'].get('estado'), 'activo')
        self.assertEqual(mapping['S2'].get('segmento'), 'vip')

    def test_prueba5_import_costs_varios_casos(self):
        # Crear producto válido
        p = Productos.objects.create(nombre='ProdOk', categoria='CatI', precio=9.99, costo=None, stock=10,
                                     vendidos=0, tendencias=Productos.TENDENCIA_BAJA, estado=Productos.ESTADO_DISPONIBLE)
        client = self.client

        # CSV válido
        csv_valid = 'nombre,costo\nProdOk,9.99\n'
        file_valid = io.BytesIO(csv_valid.encode('utf-8'))
        file_valid.name = 'costos_valid.csv'
        resp = client.post('/api/productos/costos/importar/',
                           {'file': file_valid}, format='multipart')
        self.assertIn(resp.status_code, (200, 201))
        if resp.status_code == 200:
            data = resp.json()
            self.assertIn('updated', data)
            self.assertEqual(data.get('errors'), [])
            # Releer producto y verificar costo
            p.refresh_from_db()
            self.assertAlmostEqual(float(p.costo or 0), 9.99, places=2)

        # CSV con costo inválido
        csv_bad_cost = 'nombre,costo\nProdOk,abc\n'
        file_bad = io.BytesIO(csv_bad_cost.encode('utf-8'))
        file_bad.name = 'costos_bad.csv'
        resp2 = client.post('/api/productos/costos/importar/',
                            {'file': file_bad}, format='multipart')
        self.assertIn(resp2.status_code, (200, 201, 400))
        if resp2.status_code == 200:
            d2 = resp2.json()
            self.assertTrue(len(d2.get('errors', [])) >= 1)

        # CSV con producto no encontrado
        csv_no = 'nombre,costo\nNoExiste,1.23\n'
        file_no = io.BytesIO(csv_no.encode('utf-8'))
        file_no.name = 'costos_no.csv'
        resp3 = client.post('/api/productos/costos/importar/',
                            {'file': file_no}, format='multipart')
        self.assertIn(resp3.status_code, (200, 201))
        if resp3.status_code == 200:
            d3 = resp3.json()
            self.assertTrue(len(d3.get('errors', [])) >= 1)

        # CSV con fila sin nombre
        csv_noname = 'nombre,costo\n,5.00\n'
        file_nn = io.BytesIO(csv_noname.encode('utf-8'))
        file_nn.name = 'costos_noname.csv'
        resp4 = client.post('/api/productos/costos/importar/',
                            {'file': file_nn}, format='multipart')
        self.assertIn(resp4.status_code, (200, 201))
        if resp4.status_code == 200:
            d4 = resp4.json()
            self.assertTrue(len(d4.get('errors', [])) >= 1)
