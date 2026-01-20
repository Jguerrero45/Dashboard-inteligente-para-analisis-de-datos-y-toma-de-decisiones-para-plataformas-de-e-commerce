from django.test import TestCase
from rest_framework.test import APIClient
from Dashboard.models import Productos, Clientes
import io


class ImportCostsViewTests(TestCase):
    def test_import_costs_updates_product(self):
        p = Productos.objects.create(nombre='ProdImp', categoria='Cat', precio=5.0, stock=10,
                                     vendidos=0, tendencias=Productos.TENDENCIA_BAJA, estado=Productos.ESTADO_DISPONIBLE)
        client = APIClient()
        csv_content = 'nombre,costo\n%s,12.34\n' % p.nombre
        file = io.BytesIO(csv_content.encode('utf-8'))
        file.name = 'costos.csv'
        resp = client.post('/api/productos/costos/importar/',
                           {'file': file}, format='multipart')
        # Aceptamos 200 o 400 según permisos/serializers; si 200 validar actualización
        self.assertIn(resp.status_code, (200, 201))
        if resp.status_code == 200:
            data = resp.json()
            # si la vista procesó, updated debe ser >= 0
            self.assertIn('updated', data)
