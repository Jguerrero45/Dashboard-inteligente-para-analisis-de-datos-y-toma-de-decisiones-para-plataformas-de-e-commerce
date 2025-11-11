# nombre de usuario : admin
# correo: admin@ejemplo.com
# contraseña: 1234

from django.contrib import admin
from .models import Clientes

admin.site.register(Clientes)
