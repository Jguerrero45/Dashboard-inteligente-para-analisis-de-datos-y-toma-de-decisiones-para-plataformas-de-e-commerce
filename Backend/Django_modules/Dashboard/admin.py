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

# Personalizaciones del Admin
# Cambiar el texto mostrado en el admin y la URL del enlace "Ver sitio"
admin.site.site_header = "DIPPDE admin"
admin.site.site_title = "DIPPDE admin"
admin.site.index_title = "DIPPDE admin"
admin.site.site_url = "http://localhost:5173"


admin.site.register(Clientes)
admin.site.register(Productos)
admin.site.register(Ventas)
admin.site.register(VentaItem)


# Desregistrar User para reemplazarlo
try:
    admin.site.unregister(User)
except Exception:
    pass


class DashboardUserAdmin(BaseUserAdmin):
    filter_horizontal = ('user_permissions',)

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
    )

    def get_fieldsets(self, request, obj=None):
        """Ocultar campos no deseados en edición: user_permissions, last_login, date_joined."""
        if not obj:  # Si es creación, usar add_fieldsets
            return self.add_fieldsets
        new_fieldsets = []
        for name, opts in getattr(BaseUserAdmin, 'fieldsets', ()):
            fields = list(opts.get('fields', ()))
            # Ocultar campos no deseados
            fields = [f for f in fields if f not in (
                'user_permissions', 'last_login', 'date_joined')]
            if fields:  # Solo agregar si hay campos
                new_fieldsets.append((name, dict(opts, fields=tuple(fields))))
        return tuple(new_fieldsets)


# admin.site.register(User, CustomUserAdmin)


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


admin.site.register(User, DashboardUserAdmin)
