from rest_framework import viewsets
from django.shortcuts import render
from .models import Clientes, Productos, Ventas, ModeloPrediccion, EntradaPrediccion, RecomendacionIA, VentaItem
from .serializer import (
    Clientes_Serializers,
    Productos_Serializers,
    Ventas_Serializers,
    VentaItem_Serializers,
    ModeloPrediccion_Serializers,
    EntradaPrediccion_Serializers,
    RecomendacionIA_Serializers,
)


class Clientes_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Clientes."""
    queryset = Clientes.objects.all()
    serializer_class = Clientes_Serializers


class Productos_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Productos"""
    queryset = Productos.objects.all()
    serializer_class = Productos_Serializers


class Ventas_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo de Ventas"""
    queryset = Ventas.objects.all()
    serializer_class = Ventas_Serializers


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
