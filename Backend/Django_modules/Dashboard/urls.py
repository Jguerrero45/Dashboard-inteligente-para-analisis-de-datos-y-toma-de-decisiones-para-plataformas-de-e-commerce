from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
# Register the viewset defined in this app's views
router.register(r'Clientes', views.Clientes_ViewSet)
router.register(r'Productos', views.Productos_ViewSet)
router.register(r'Ventas', views.Ventas_ViewSet)
router.register(r'Venta Item', views.VentaItem_ViewSet)
router.register(r'modelos', views.ModeloPrediccion_ViewSet)
router.register(r'predicciones', views.EntradaPrediccion_ViewSet)
router.register(r'recomendaciones', views.RecomendacionIA_ViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
