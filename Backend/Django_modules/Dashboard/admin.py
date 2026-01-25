# nombre de usuario : admin
# correo: admin@ejemplo.com
# contraseña: 1234

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Clientes, Productos, Ventas, VentaItem


admin.site.register(Clientes)
admin.site.register(Productos)
admin.site.register(Ventas)
admin.site.register(VentaItem)


# Intentar reemplazar el admin del User para ocultar "Fechas importantes" y "Grupos"
try:
    admin.site.unregister(User)
except Exception:
    pass


def _filtered_fieldsets():
    new_fieldsets = []
    for name, opts in getattr(BaseUserAdmin, 'fieldsets', ()):  # copiar, pero filtrar
        fields = list(opts.get('fields', ()))
        # eliminar campos de fechas importantes
        if 'last_login' in fields or 'date_joined' in fields:
            # si el bloque contiene esas claves, lo omitimos por completo
            continue
        # eliminar 'groups' si aparece dentro de permisos
        if 'groups' in fields:
            fields = [f for f in fields if f != 'groups']
            opts = dict(opts, fields=tuple(fields))
        new_fieldsets.append((name, opts))
    return tuple(new_fieldsets)


class CustomUserAdmin(BaseUserAdmin):
    fieldsets = _filtered_fieldsets()
    # quitar 'groups' de filter_horizontal si estaba presente
    filter_horizontal = tuple(f for f in getattr(
        BaseUserAdmin, 'filter_horizontal', ()) if f != 'groups')


admin.site.register(User, CustomUserAdmin)
