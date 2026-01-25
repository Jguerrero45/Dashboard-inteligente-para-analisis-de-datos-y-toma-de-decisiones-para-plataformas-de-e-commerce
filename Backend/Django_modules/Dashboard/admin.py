# nombre de usuario : admin
# correo: admin@ejemplo.com
# contraseña: 1234

from django.contrib import admin
from django import forms
from django.contrib.admin.widgets import FilteredSelectMultiple
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from .models import Clientes, Productos, Ventas, VentaItem


admin.site.register(Clientes)
admin.site.register(Productos)
admin.site.register(Ventas)
admin.site.register(VentaItem)


# Intentar reemplazar el admin del User para ocultar "Fechas importantes" y "Groups"
try:
    admin.site.unregister(User)
except Exception:
    pass


class CustomUserAdmin(BaseUserAdmin):
    # Mantener filter_horizontal sin 'groups' para evitar render del chooser
    # Quitar 'groups' y 'user_permissions' del widget horizontal del UserAdmin
    filter_horizontal = tuple(f for f in getattr(
        BaseUserAdmin, 'filter_horizontal', ()) if f not in ('groups', 'user_permissions'))

    def get_fieldsets(self, request, obj=None):
        """Devuelve fieldsets filtrados por petición.

        - Oculta bloques que contienen `last_login` o `date_joined`.
        - Oculta `user_permissions` para editores que no son superuser.
        - Mantiene `groups` en el formulario (se puede dejar como solo lectura para no-superusers).
        """
        new_fieldsets = []
        # copiar, pero filtrar
        for name, opts in getattr(BaseUserAdmin, 'fieldsets', ()):
            fields = list(opts.get('fields', ()))
            # eliminar campos de fechas importantes por completo
            if 'last_login' in fields or 'date_joined' in fields:
                continue
            # No mostrar user_permissions en el formulario de usuario en absoluto
            if 'user_permissions' in fields:
                fields = [f for f in fields if f != 'user_permissions']
            new_fieldsets.append((name, dict(opts, fields=tuple(fields))))
        return tuple(new_fieldsets)

    def get_readonly_fields(self, request, obj=None):
        """Hacer `groups` solo lectura para editores que no sean superuser."""
        base = tuple(getattr(BaseUserAdmin, 'readonly_fields', ()))
        if not (getattr(request, 'user', None) and getattr(request.user, 'is_superuser', False)):
            return tuple(list(base) + ['groups'])
        return base

    # No limitamos aquí `user_permissions`; lo ocultamos desde `get_fieldsets`.


admin.site.register(User, CustomUserAdmin)


class GroupAdminForm(forms.ModelForm):
    users = forms.ModelMultipleChoiceField(
        queryset=User.objects.all(),
        required=False,
        widget=FilteredSelectMultiple('users', False)
    )

    class Meta:
        model = Group
        fields = ('name', 'permissions', 'users')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['users'].initial = self.instance.user_set.all()

    def save(self, commit=True):
        group = super().save(commit=commit)
        if commit:
            group.user_set.set(self.cleaned_data.get('users'))
        else:
            # En caso de no commit, defer la asignación
            self._save_m2m = lambda: group.user_set.set(
                self.cleaned_data.get('users'))
        return group


class GroupAdmin(admin.ModelAdmin):
    form = GroupAdminForm
    filter_horizontal = ('permissions',)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        # Limitar permisos en el admin de Grupos cuando el editor no es superuser
        if db_field.name == 'permissions' and not (getattr(request, 'user', None) and getattr(request.user, 'is_superuser', False)):
            # Mostrar solo permisos 'view_*' del app 'Dashboard' para quien edite grupos y no sea superuser
            qs = Permission.objects.filter(
                content_type__app_label='Dashboard', codename__startswith='view_')
            kwargs['queryset'] = qs.order_by('content_type__model', 'codename')
            return db_field.formfield(**kwargs)
        return super().formfield_for_manytomany(db_field, request, **kwargs)


try:
    admin.site.unregister(Group)
except Exception:
    pass

admin.site.register(Group, GroupAdmin)
