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
router.register(r'recomendaciones', views.RecomendacionIA_ViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Endpoint para registro de usuarios
    path('register/', views.RegisterView.as_view(), name='register'),
    # Export endpoints for reports
    path('export/pdf/', views.ExportPDFView.as_view(), name='export-pdf'),
    path('export/csv/', views.ExportCSVView.as_view(), name='export-csv'),
    # Costos: exportar plantilla e importar CSV
    path('productos/costos/exportar-plantilla/',
         views.ExportCostTemplateView.as_view(), name='export-cost-template'),
    path('productos/costos/importar/',
         views.ImportCostsView.as_view(), name='import-costs'),
    # Endpoints para métricas del dashboard
    path('metrics/sales-monthly/',
         views.SalesMonthlyView.as_view(), name='sales-monthly'),
    path('metrics/revenue-by-category/',
         views.RevenueByCategoryView.as_view(), name='revenue-by-category'),
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
    path('metrics/returning-customers-rate/',
         views.ReturningCustomersRateView.as_view(), name='returning-customers-rate'),
    path('metrics/products-growth/',
         views.ProductsGrowthView.as_view(), name='products-growth'),
    # JSON estructurado (mes/producto/categoría)
    path('metrics/structured-monthly/',
         views.StructuredMonthlyView.as_view(), name='structured-monthly'),
    path('metrics/structured-by-product/',
         views.StructuredByProductView.as_view(), name='structured-by-product'),
    path('metrics/structured-by-category/',
         views.StructuredByCategoryView.as_view(), name='structured-by-category'),
    # Recomendaciones IA (Gemini)
    path('ai/recommendations/',
         views.AIRecommendationsView.as_view(), name='ai-recommendations'),
    # Perfil de usuario (autenticado)
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/avatar/', views.ProfileAvatarUploadView.as_view(),
         name='profile-avatar'),
]
