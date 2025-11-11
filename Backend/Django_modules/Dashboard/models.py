from django.db import models


class Clientes(models.Model):
    nombre = models.CharField(max_length=150)
    correo = models.CharField(max_length=200)
    telefono = models.CharField(max_length=50)
    fecha_registro = models.DateField(
        ("Fecha de registro"), auto_now=False, auto_now_add=False)
    cantidad_compras = models.IntegerField()
    tipo_cliente = models.CharField(max_length=50)


class Productos(models.Model):
    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=200)
    precio = models.FloatField()
    costo = models.FloatField()
    utilidad = models.FloatField()
    stock = models.IntegerField()
    vendidos = models.IntegerField()
    # Tendencias
    TENDENCIA_ALTA = 'alta'
    TENDENCIA_MEDIA = 'media'
    TENDENCIA_BAJA = 'baja'
    TENDENCIA_CHOICES = [
        (TENDENCIA_ALTA, 'alta'),
        (TENDENCIA_MEDIA, 'media'),
        (TENDENCIA_BAJA, 'baja'),
    ]

    tendencias = models.CharField(
        max_length=15,
        choices=TENDENCIA_CHOICES,
        help_text='Tendencia del producto',
    )

    # Estados
    ESTADO_DISPONIBLE = 'disponible'
    ESTADO_BAJO = 'bajo'
    ESTADO_AGOTADO = 'agotado'

    ESTADO_CHOICES = [
        (ESTADO_DISPONIBLE, 'Disponible'),
        (ESTADO_BAJO, 'Bajo en stock'),
        (ESTADO_AGOTADO, 'Agotado'),
    ]

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_DISPONIBLE,
        help_text='Estado del producto',
    )
