from rest_framework import serializers
from .models import Clientes


class Clientes_Serializers(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = '__all__'
