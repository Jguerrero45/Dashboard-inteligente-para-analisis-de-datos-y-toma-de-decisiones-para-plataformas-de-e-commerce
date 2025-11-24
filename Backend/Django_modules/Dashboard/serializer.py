from rest_framework import serializers
from .models import Clientes, Productos, Ventas, ModeloPrediccion, EntradaPrediccion, RecomendacionIA


class Clientes_Serializers(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = '__all__'


class Productos_Serializers(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = '__all__'


class Ventas_Serializers(serializers.ModelSerializer):
    class Meta:
        model = Ventas
        fields = '__all__'


class ModeloPrediccion_Serializers(serializers.ModelSerializer):
    class Meta:
        model = ModeloPrediccion
        fields = '__all__'


class EntradaPrediccion_Serializers(serializers.ModelSerializer):
    class Meta:
        model = EntradaPrediccion
        fields = '__all__'


class RecomendacionIA_Serializers(serializers.ModelSerializer):
    class Meta:
        model = RecomendacionIA
        fields = '__all__'
