from django.db import models


class Clientes(models.Model):
    nombre = models.CharField(max_length=150)
    correo = models.CharField(max_length=200)
    telefono = models.CharField(max_length=50)
    fecha_registro = models.DateField(
        ("Fecha de registro"), auto_now=False, auto_now_add=False)
    cantidad_compras = models.IntegerField()
    tipo_cliente = models.CharField(max_length=50)
