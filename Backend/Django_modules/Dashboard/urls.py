from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
# Register the viewset defined in this app's views
router.register(r'Clientes', views.Clientes_ViewSet)
router.register(r'Productos', views.Productos_ViewSet)
router.register(r'Tasa', views.Tasa_ViewSet, basename='tasa')
router.register(r'Ventas', views.Ventas_ViewSet)
router.register(r'Venta Item', views.VentaItem_ViewSet)
router.register(r'modelos', views.ModeloPrediccion_ViewSet)
router.register(r'predicciones', views.EntradaPrediccion_ViewSet)
router.register(r'recomendaciones', views.RecomendacionIA_ViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Endpoint para registro de usuarios
    path('register/', views.RegisterView.as_view(), name='register'),
    # Export endpoints for reports
    path('export/pdf/', views.ExportPDFView.as_view(), name='export-pdf'),
    path('export/csv/', views.ExportCSVView.as_view(), name='export-csv'),
    # Endpoints para métricas del dashboard
    path('metrics/sales-monthly/',
         views.SalesMonthlyView.as_view(), name='sales-monthly'),
    path('metrics/revenue-by-category/',
         views.RevenueByCategoryView.as_view(), name='revenue-by-category'),
    path('metrics/quantity-by-category/',
         views.QuantityByCategoryView.as_view(), name='quantity-by-category'),
    path('metrics/top-products/',
         views.TopProductsView.as_view(), name='top-products'),
    path('metrics/customers-monthly/',
         views.CustomersMonthlyView.as_view(), name='customers-monthly'),
    path('metrics/top-customers-monthly/',
         views.TopCustomersMonthlyView.as_view(), name='top-customers-monthly'),
    path('metrics/top-categories-monthly/',
         views.TopCategoriesMonthlyView.as_view(), name='top-categories-monthly'),
    path('metrics/sales-heatmap/',
         views.SalesHeatmapView.as_view(), name='sales-heatmap'),
    # Recomendaciones IA (Gemini)
    path('ai/recommendations/',
         views.AIRecommendationsView.as_view(), name='ai-recommendations'),
]
