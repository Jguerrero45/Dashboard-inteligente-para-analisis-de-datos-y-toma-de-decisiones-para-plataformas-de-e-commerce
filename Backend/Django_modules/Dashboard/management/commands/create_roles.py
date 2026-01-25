from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.apps import apps


class Command(BaseCommand):
    help = 'Crea los roles iniciales: Gerente y Empleado y asigna permisos básicos.'

    def handle(self, *args, **options):
        app_label = 'Dashboard'

        # Nombres de grupos
        gerente_name = 'Gerente'
        empleado_name = 'Empleado'

        # Crear o recuperar grupos
        gerente, _ = Group.objects.get_or_create(name=gerente_name)
        empleado, _ = Group.objects.get_or_create(name=empleado_name)

        # Listar modelos del app Dashboard
        model_names = [m.__name__ for m in apps.get_app_config(
            'Dashboard').get_models()]

        self.stdout.write(f'Modelos detectados en {app_label}: {model_names}')

        # Limpiar permisos actuales de los grupos (no eliminar otros grupos fuera de este comando)
        gerente.permissions.clear()
        empleado.permissions.clear()

        # Asignar permisos:
        # - Gerente: permisos 'view_*' sobre todos los modelos del app Dashboard
        # - Empleado: permisos 'view_*' sobre un subconjunto (Productos, Clientes, Ventas, VentaItem, RecomendacionIA, EntradaPrediccion, ModeloPrediccion)

        empleado_allowed = {
            'Productos', 'Clientes', 'Ventas', 'VentaItem',
            'RecomendacionIA', 'EntradaPrediccion', 'ModeloPrediccion'
        }

        for model in apps.get_app_config('Dashboard').get_models():
            ct = ContentType.objects.get_for_model(model)
            view_perms = Permission.objects.filter(
                content_type=ct, codename__startswith='view_')

            # Asignar view_* a gerente
            for p in view_perms:
                gerente.permissions.add(p)

            # Asignar view_* solo para modelos permitidos al empleado
            if model.__name__ in empleado_allowed:
                for p in view_perms:
                    empleado.permissions.add(p)
