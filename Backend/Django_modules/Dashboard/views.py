from rest_framework import viewsets
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from .models import Clientes, Productos, Ventas, ModeloPrediccion, EntradaPrediccion, RecomendacionIA, VentaItem, Tasa
from .serializer import (
    Clientes_Serializers,
    Productos_Serializers,
    Ventas_Serializers,
    VentaItem_Serializers,
    ModeloPrediccion_Serializers,
    EntradaPrediccion_Serializers,
    RecomendacionIA_Serializers,
    Tasa_Serializers,
    UserRegistrationSerializer,
)
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Max


class Clientes_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Clientes."""
    queryset = Clientes.objects.all()
    serializer_class = Clientes_Serializers

    def get_queryset(self):
        # Anotamos compras, gasto_total y última compra para que el serializer
        # pueda calcular estado y devolver agregados en la lista.
        return Clientes.objects.annotate(
            compras=Count('ventas'),
            gasto_total=Sum('ventas__precio_total'),
            ultima_compra=Max('ventas__fecha')
        ).order_by('-id')


class Productos_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Productos"""
    queryset = Productos.objects.all()
    serializer_class = Productos_Serializers

    def get_queryset(self):
        # Anotamos ventas/ingresos/última venta para el dashboard de productos.
        return Productos.objects.annotate(
            ventas_count=Count('venta_items'),
            ingreso_total=Sum('venta_items__precio_total'),
            vendidos_total=Sum('venta_items__cantidad'),
            ultima_venta=Max('venta_items__venta__fecha')
        ).order_by('-id')


class Ventas_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo de Ventas"""
    queryset = Ventas.objects.all()
    serializer_class = Ventas_Serializers

    def get_queryset(self):
        # Evitar N+1: traer cliente y items + producto de cada item
        return Ventas.objects.select_related('cliente').prefetch_related('items__producto').order_by('-fecha')


class ModeloPrediccion_ViewSet(viewsets.ModelViewSet):
    """ViewSet para metadatos de modelos de predicción."""
    queryset = ModeloPrediccion.objects.all()
    serializer_class = ModeloPrediccion_Serializers


class EntradaPrediccion_ViewSet(viewsets.ModelViewSet):
    """ViewSet para entradas/resultados de predicción."""
    queryset = EntradaPrediccion.objects.all()
    serializer_class = EntradaPrediccion_Serializers


class RecomendacionIA_ViewSet(viewsets.ModelViewSet):
    queryset = RecomendacionIA.objects.all()
    serializer_class = RecomendacionIA_Serializers


class VentaItem_ViewSet(viewsets.ModelViewSet):
    queryset = VentaItem.objects.all()
    serializer_class = VentaItem_Serializers


class RegisterView(generics.CreateAPIView):
    """Endpoint para registrar un nuevo usuario."""
    queryset = get_user_model().objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer


class Tasa_ViewSet(viewsets.ViewSet):
    """Endpoint liviano para obtener/crear la tasa del día.

    Comportamiento GET (list):
    - Si existe una Tasa con `fecha=today`, devolverla.
    - Si no existe, consultar un proveedor externo (exchangerate.host), guardar
      la tasa USD->VES en la tabla `Tasa` y devolverla.
    """

    def list(self, request):
        from django.utils import timezone
        import urllib.request
        import json

        today = timezone.now().date()
        tasa_obj = Tasa.objects.filter(
            fecha=today).order_by('-creado_en').first()
        if tasa_obj:
            serializer = Tasa_Serializers(tasa_obj)
            return Response(serializer.data)

        # No hay tasa para hoy: intentar obtenerla de exchangerate.host
        try:
            url = 'https://api.exchangerate.host/latest?base=USD&symbols=VES'
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            rate = data.get('rates', {}).get('VES')
            if rate is None:
                raise ValueError('No se obtuvo tasa VES en la respuesta')

            # Guardar en la BD
            tasa_obj = Tasa.objects.create(fecha=today, tasa=rate)
            serializer = Tasa_Serializers(tasa_obj)
            return Response(serializer.data)
        except Exception as e:
            # En caso de falla, intentar devolver la última tasa guardada
            last = Tasa.objects.order_by('-fecha').first()
            if last:
                serializer = Tasa_Serializers(last)
                return Response(serializer.data)
            # Si no hay nada, devolver error 503
            return Response({'detail': 'No se pudo obtener la tasa'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
