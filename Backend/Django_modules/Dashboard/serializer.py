from rest_framework import serializers
from .models import Clientes, Productos


class Clientes_Serializers(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = '__all__'


class Productos_Serializers(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = '__all__'
