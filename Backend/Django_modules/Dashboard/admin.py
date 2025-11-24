# nombre de usuario : admin
# correo: admin@ejemplo.com
# contraseña: 1234

from django.contrib import admin
from .models import Clientes, Productos, Ventas

admin.site.register(Clientes)
admin.site.register(Productos)
admin.site.register(Ventas)
