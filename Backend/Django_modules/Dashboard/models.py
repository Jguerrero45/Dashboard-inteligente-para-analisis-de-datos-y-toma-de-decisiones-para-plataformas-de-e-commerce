from django.db import models, IntegrityError
import random
from django.utils import timezone
from django.contrib.auth import get_user_model


class Clientes(models.Model):
    nombre = models.CharField(max_length=150)
    apellido = models.CharField(max_length=150)
    cedula = models.CharField(max_length=25)
    ciudad = models.CharField(max_length=50)
    correo = models.CharField(max_length=200)
    telefono = models.CharField(max_length=50)
    fecha_registro = models.DateField(
        ("Fecha de registro"), auto_now=False, auto_now_add=False)
    cantidad_compras = models.IntegerField()
    # Tipos de cliente
    TIPO_VIP = 'vip'
    TIPO_NUEVO = 'nuevo'
    TIPO_FRECUENTE = 'frecuente'
    # Opciones para tipo de cliente
    TIPO_CLIENTE_CHOICES = [
        (TIPO_VIP, 'VIP'),
        (TIPO_NUEVO, 'Nuevo'),
        (TIPO_FRECUENTE, 'Frecuente'),
    ]

    tipo_cliente = models.CharField(
        max_length=20, choices=TIPO_CLIENTE_CHOICES, default=TIPO_NUEVO)
    # ID legible/mostrable persistente (opcionalmente diferente de la PK)
    display_id = models.PositiveIntegerField(
        null=True, blank=True, unique=True)

    def save(self, *args, **kwargs):
        # Asigna un display_id secuencial empezando en 1000 si aún no existe.
        # Estrategia:
        #  - Buscar el máximo display_id existente (>= 1000) y usar max+1.
        #  - Si no existe ninguno, comenzar en 1000.
        #  - En caso de condición de carrera en la base de datos (IntegrityError
        #    por unique constraint), reintentar unas pocas veces incrementando.
        if not self.display_id:
            START = 1000
            MAX_RETRIES = 5
            for attempt in range(MAX_RETRIES):
                # Obtener el máximo display_id actual >= START
                qs = Clientes.objects.filter(
                    display_id__isnull=False, display_id__gte=START)
                max_row = qs.order_by('-display_id').first()
                if max_row and max_row.display_id:
                    candidate = max_row.display_id + 1
                else:
                    candidate = START

                self.display_id = candidate
                try:
                    # Intentar guardar; si choque de unique ocurre, reintentar
                    super().save(*args, **kwargs)
                    return
                except IntegrityError:
                    # Otro proceso pudo haber tomado el mismo candidate.
                    # Borrar el candidato y reintentar incrementando.
                    self.display_id = None
                    if attempt == MAX_RETRIES - 1:
                        # Agotar reintentos: propagar error para que el operador
                        # pueda investigar (o ejecutar la migración de datos manualmente).
                        raise
                    # si quedan reintentos, volver a intentar en el siguiente ciclo
                    continue
        else:
            super().save(*args, **kwargs)


class Productos(models.Model):
    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=200)
    precio = models.FloatField()
    # Costo de adquisición (opcional). Permite cálculos reales de margen.
    costo = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
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


class Ventas(models.Model):

    """Representa una transacción (venta) que puede contener N items.

    Antes `Ventas` representaba una venta por producto. Para soportar pedidos
    con múltiples productos se separa en `Ventas` (cabecera) y `VentaItem`
    (líneas/items vinculados a la venta).
    """

    fecha = models.DateTimeField()
    cliente = models.ForeignKey(
        Clientes,
        on_delete=models.PROTECT,
        related_name='ventas',
    )

    # total de la venta (suma de items). Opcionalmente puede calcularse al guardar
    precio_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)

    METODO_EFECTIVO = 'efectivo'
    METODO_TARJETA = 'tarjeta'
    METODO_PM = 'pago_movil'
    METODO_TRANSFERENCIA = 'transferencia'

    METODO_CHOICES = [
        (METODO_EFECTIVO, 'Efectivo'),
        (METODO_TARJETA, 'Tarjeta'),
        (METODO_PM, 'Pago móvil'),
        (METODO_TRANSFERENCIA, 'Transferencia'),
    ]

    metodo_compra = models.CharField(
        max_length=30,
        choices=METODO_CHOICES,
    )

    ESTADO_PENDIENTE = 'pendiente'
    ESTADO_COMPLETADA = 'completada'
    ESTADO_CANCELADA = 'cancelada'
    ESTADO_REEMBOLSADA = 'reembolsada'

    ESTADO_CHOICES = [
        (ESTADO_PENDIENTE, 'Pendiente'),
        (ESTADO_COMPLETADA, 'Completada'),
        (ESTADO_CANCELADA, 'Cancelada'),
        (ESTADO_REEMBOLSADA, 'Reembolsada'),
    ]

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_PENDIENTE,
    )

    class Meta:
        ordering = ['-fecha']


class VentaItem(models.Model):
    """Item (línea) de una venta: referencia a producto, cantidad y precios."""

    venta = models.ForeignKey(
        Ventas,
        on_delete=models.CASCADE,
        related_name='items',
    )

    producto = models.ForeignKey(
        Productos,
        on_delete=models.PROTECT,
        related_name='venta_items',
    )

    cantidad = models.PositiveIntegerField()

    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    precio_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} @ {self.precio_unitario}"


class ModeloPrediccion(models.Model):
    """Metadatos de una ejecución/versión del modelo de predicción.

    Ejemplos: 'ventas_mensuales_v1', 'demanda_producto_v2', etc.
    """

    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    algoritmo = models.CharField(max_length=200, blank=True)
    version = models.CharField(max_length=50, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    confianza_global = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        ordering = ['-creado_en']


class EntradaPrediccion(models.Model):
    """Punto de datos para comparativas real vs predicción.

    Diseñado para soportar las gráficas del frontend: ventas mensuales, demanda
    por producto, tendencias, estacionalidad, abandono (churn), optimización de precios, etc.
    """

    TIPO_VENTAS = 'ventas'
    TIPO_DEMANDA = 'demanda'
    TIPO_TENDENCIA = 'tendencia'
    TIPO_ESTACIONALIDAD = 'estacionalidad'
    TIPO_CATEGORIA = 'categoria'
    TIPO_ABANDONO = 'abandono'
    TIPO_OPTIMIZACION_PRECIOS = 'optimizacion_precios'
    TIPO_OTRO = 'otro'

    TIPO_CHOICES = [
        (TIPO_VENTAS, 'Ventas'),
        (TIPO_DEMANDA, 'Demanda'),
        (TIPO_TENDENCIA, 'Tendencia'),
        (TIPO_ESTACIONALIDAD, 'Estacionalidad'),
        (TIPO_CATEGORIA, 'Desempeño por categoría'),
        (TIPO_ABANDONO, 'Predicción de abandono'),
        (TIPO_OPTIMIZACION_PRECIOS, 'Optimización de precios'),
        (TIPO_OTRO, 'Otro'),
    ]

    modelo = models.ForeignKey(
        ModeloPrediccion, on_delete=models.CASCADE, related_name='entradas')
    tipo = models.CharField(
        max_length=50, choices=TIPO_CHOICES, default=TIPO_OTRO)

    periodo_inicio = models.DateField(null=True, blank=True)
    etiqueta_periodo = models.CharField(max_length=50, blank=True)

    producto = models.ForeignKey(
        Productos, null=True, blank=True, on_delete=models.PROTECT, related_name='predicciones')
    categoria = models.CharField(max_length=200, blank=True)
    segmento = models.CharField(max_length=200, blank=True)

    valor_real = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True)
    valor_predicho = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True)
    confianza = models.IntegerField(
        null=True, blank=True, help_text='Confianza en % (0-100)')

    metadatos = models.JSONField(null=True, blank=True)

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-periodo_inicio', '-creado_en']


class RecomendacionIA(models.Model):
    """Recomendaciones generadas por el motor IA asociadas a un producto.

    Campos mínimos solicitados:
    - producto: FK a `Productos`
    - fecha: fecha/hora de la recomendación
    - descripcion: texto con la recomendación
    - prioridad: choice (alta/media/baja)
    """

    PRIORIDAD_ALTA = 'alta'
    PRIORIDAD_MEDIA = 'media'
    PRIORIDAD_BAJA = 'baja'

    PRIORIDAD_CHOICES = [
        (PRIORIDAD_ALTA, 'Alta'),
        (PRIORIDAD_MEDIA, 'Media'),
        (PRIORIDAD_BAJA, 'Baja'),
    ]

    producto = models.ForeignKey(
        Productos,
        on_delete=models.PROTECT,
        related_name='recomendaciones_ia',
    )

    fecha = models.DateTimeField(
        default=timezone.now)

    descripcion = models.TextField()

    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default=PRIORIDAD_MEDIA,
        help_text='Prioridad de la recomendación',
    )

    impacto = models.TextField(
        blank=True, help_text='Impacto estimado (opcional)')

    metadatos = models.JSONField(
        null=True, blank=True, help_text='Campos adicionales/metadata generada por la IA')

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-creado_en']
        verbose_name = 'Recomendación IA'
        verbose_name_plural = 'Recomendaciones IA'


class Tasa(models.Model):
    """Modelo simple para registrar tasas asociadas a una fecha.

    Cada instancia representa la tasa en una fecha determinada.
    """

    fecha = models.DateField(unique=True)
    tasa = models.DecimalField(max_digits=10, decimal_places=6)

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']


class Store(models.Model):
    """Representa una tienda externa cuya API contiene los mismos recursos.

    Se almacena por usuario (owner) para que cada usuario administre sus
    propias tiendas. El `api_url` será la base que el frontend puede usar
    para consumir datos de esa tienda.
    """

    name = models.CharField(max_length=150)
    api_url = models.URLField(
        max_length=500, help_text='URL base de la API de la tienda')
    owner = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name='stores')
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado_en']

    def __str__(self):
        return f"{self.name} ({self.api_url})"


class UserProfile(models.Model):
    """Perfil de usuario extendido para datos adicionales y avatar."""
    user = models.OneToOneField(
        get_user_model(), on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=50, blank=True)
    company = models.CharField(max_length=120, blank=True)
    address = models.CharField(max_length=255, blank=True)
    avatar_path = models.CharField(
        max_length=255, blank=True, help_text='Ruta relativa en MEDIA_ROOT')

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    # Tienda seleccionada por el usuario. Puede ser null (usar API por defecto)
    selected_store = models.ForeignKey(
        Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')

    def __str__(self):
        return f"Perfil {self.user_id}"
