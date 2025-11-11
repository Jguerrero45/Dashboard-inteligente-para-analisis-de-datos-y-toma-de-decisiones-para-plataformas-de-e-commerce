from rest_framework import viewsets
from django.shortcuts import render
from .models import Clientes
from .serializer import Clientes_Serializers


class Clientes_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Clientes."""
    queryset = Clientes.objects.all()
    serializer_class = Clientes_Serializers
