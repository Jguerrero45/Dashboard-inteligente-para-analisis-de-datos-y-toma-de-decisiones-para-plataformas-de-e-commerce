# nombre de usuario : admin
# correo: admin@ejemplo.com
# contraseña: 1234

from django.contrib import admin
from .models import Clientes, Productos

admin.site.register(Clientes)
admin.site.register(Productos)
