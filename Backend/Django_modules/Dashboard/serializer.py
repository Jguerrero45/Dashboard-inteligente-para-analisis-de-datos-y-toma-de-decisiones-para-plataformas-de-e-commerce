from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from .models import Clientes, Productos, Ventas, ModeloPrediccion, EntradaPrediccion, RecomendacionIA, VentaItem, Tasa, UserProfile


class Clientes_Serializers(serializers.ModelSerializer):
    # Campos agregados para listados / dashboard
    compras = serializers.IntegerField(read_only=True)
    gasto_total = serializers.DecimalField(
        max_digits=18, decimal_places=2, read_only=True)
    estado = serializers.SerializerMethodField()
    nombre = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    segmento = serializers.SerializerMethodField()

    class Meta:
        model = Clientes
        # mantenemos los campos del modelo; los campos declarados arriba
        # (nombre, email, compras, gasto_total, estado) sobrescribirán
        # los campos del modelo cuando correspondan.
        fields = '__all__'

    def get_estado(self, obj):
        ultima = getattr(obj, 'ultima_compra', None)
        if not ultima:
            return 'inactivo'
        try:
            ultima_date = ultima.date() if hasattr(ultima, 'date') else ultima
        except Exception:
            ultima_date = None
        if not ultima_date:
            return 'inactivo'
        from django.utils import timezone
        from datetime import timedelta
        if (timezone.now().date() - ultima_date) <= timedelta(days=365):
            return 'activo'
        return 'inactivo'

    def get_nombre(self, obj):
        return f"{obj.nombre} {obj.apellido}".strip()

    def get_email(self, obj):
        return obj.correo

    def get_segmento(self, obj):
        # Determinar segmento a partir de la cantidad de compras si está disponible
        try:
            compras = int(getattr(obj, 'cantidad_compras', 0) or 0)
        except Exception:
            compras = 0
        if compras <= 5:
            return 'nuevo'
        if compras > 50:
            return 'vip'
        return 'frecuente'
    # display_id ahora es un campo del modelo (persistente); se incluirá en
    # la serialización automáticamente por fields='__all__'


class Productos_Serializers(serializers.ModelSerializer):
    # Campos agregados por anotación en el queryset (read-only)
    ventas_count = serializers.IntegerField(read_only=True)
    ingreso_total = serializers.DecimalField(
        max_digits=18, decimal_places=2, read_only=True)
    vendidos_total = serializers.IntegerField(read_only=True)
    ultima_venta = serializers.DateTimeField(read_only=True)
    # Normalizamos estado para el frontend (activo, bajo-stock, agotado)
    estado = serializers.SerializerMethodField()

    class Meta:
        model = Productos
        fields = '__all__'

    def get_estado(self, obj):
        # Determinar estado a partir del stock para asegurar consistencia
        try:
            stock = int(getattr(obj, 'stock', 0) or 0)
        except Exception:
            stock = 0
        if stock == 0:
            return 'agotado'
        if stock < 50:
            return 'bajo-stock'
        return 'activo'


class Tasa_Serializers(serializers.ModelSerializer):
    class Meta:
        model = Tasa
        fields = '__all__'


class VentaItem_Serializers(serializers.ModelSerializer):
    producto_nombre = serializers.SerializerMethodField()

    class Meta:
        model = VentaItem
        fields = ('id', 'venta', 'producto', 'producto_nombre',
                  'cantidad', 'precio_unitario', 'precio_total')

    def get_producto_nombre(self, obj):
        try:
            return obj.producto.nombre
        except Exception:
            return str(obj.producto)


class Ventas_Serializers(serializers.ModelSerializer):
    # incluir items anidados y nombre legible del cliente
    items = VentaItem_Serializers(many=True, read_only=True)
    cliente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Ventas
        fields = '__all__'

    def get_cliente_nombre(self, obj):
        try:
            return f"{obj.cliente.nombre} {obj.cliente.apellido}".strip()
        except Exception:
            return str(obj.cliente)


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


class VentaItem_Serializers(serializers.ModelSerializer):
    producto_nombre = serializers.SerializerMethodField()

    class Meta:
        model = VentaItem
        fields = ('id', 'venta', 'producto', 'producto_nombre',
                  'cantidad', 'precio_unitario', 'precio_total')

    def get_producto_nombre(self, obj):
        try:
            return obj.producto.nombre
        except Exception:
            return str(obj.producto)


# Serializer para registro de usuarios
User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True, validators=[
                                   UniqueValidator(queryset=User.objects.all())])

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError(
                {"password": "Las contraseñas no coinciden."})

        # validar fuerza de la contraseña con los validadores de Django
        try:
            validate_password(attrs.get('password'))
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfile_Serializers(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone', 'company', 'address', 'avatar_path')
