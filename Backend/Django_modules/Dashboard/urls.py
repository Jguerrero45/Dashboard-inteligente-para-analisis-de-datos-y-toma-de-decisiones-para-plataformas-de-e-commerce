from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
# Register the viewset defined in this app's views
router.register(r'Clientes', views.Clientes_ViewSet)
router.register(r'Productos', views.Productos_ViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
