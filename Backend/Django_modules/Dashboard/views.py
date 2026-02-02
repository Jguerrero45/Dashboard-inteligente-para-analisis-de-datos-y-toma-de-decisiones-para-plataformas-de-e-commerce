from rest_framework import viewsets
from rest_framework import generics, permissions
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework import status
import logging
from django.shortcuts import render
from .models import Clientes, Productos, Ventas, RecomendacionIA, VentaItem, Tasa, Store
from .serializer import (
    Clientes_Serializers,
    Productos_Serializers,
    Ventas_Serializers,
    VentaItem_Serializers,
    RecomendacionIA_Serializers,
    Tasa_Serializers,
    UserRegistrationSerializer,
    StoreSerializer,
)
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Max, Q, Exists, OuterRef
from django.db.models import F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from django.views import View
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string
import io
import csv
import datetime
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from .services.gemini_client import (
    generate_ai_recommendation,
    GeminiError,
    build_structured_output,
)
from django.db.models import DecimalField, ExpressionWrapper
from .models import UserProfile
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


def _user_in_group(user, name: str) -> bool:
    try:
        return bool(user and user.is_authenticated and user.groups.filter(name=name).exists())
    except Exception:
        return False


class IsGerenteOrReadOnly(BasePermission):
    """Permiso: solo Gerente o superuser puede usar métodos no seguros sobre Productos.

    - GET/HEAD/OPTIONS quedan permitidos para todos (read-only).
    - Métodos como POST/PUT/PATCH/DELETE requieren que el usuario sea superuser
      o pertenezca al grupo 'Gerente' o tenga el permiso 'change_productos'.
    """

    def has_permission(self, request, view):
        # permitir lectura a cualquiera
        if request.method in permissions.SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        if getattr(user, 'is_superuser', False):
            return True
        # Chequear pertenencia a grupo Gerente
        if _user_in_group(user, 'Gerente'):
            return True
        # Chequear permiso explícito (intentar con mayúscula/minúscula de app label)
        try:
            if user.has_perm('Dashboard.change_productos') or user.has_perm('dashboard.change_productos'):
                return True
        except Exception:
            pass
        return False


MONTH_LABELS_ES = ["Ene", "Feb", "Mar", "Abr", "May",
                   "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "No se encontró una cuenta activa con las credenciales proporcionadas."
    }


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class Clientes_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Clientes."""
    queryset = Clientes.objects.all()
    serializer_class = Clientes_Serializers

    def get_queryset(self):
        # Anotamos compras, gasto_total y última compra para que el serializer
        # pueda calcular estado y devolver agregados en la lista.
        return Clientes.objects.annotate(
            compras=Count('ventas'),
            gasto_total=Sum('ventas__precio_total'),
            ultima_compra=Max('ventas__fecha')
        ).order_by('-id')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class Productos_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Productos"""
    queryset = Productos.objects.all()
    serializer_class = Productos_Serializers

    def get_queryset(self):
        # Anotamos ventas/ingresos/última venta para el dashboard de productos.
        # Anotamos ventas/ingresos/última venta para el dashboard de productos.
        # Considerar solo items de ventas completadas para métrica consistente
        # con el endpoint de ingresos por categoría.
        completed_filter = Q(
            venta_items__venta__estado=Ventas.ESTADO_COMPLETADA)
        return Productos.objects.annotate(
            ventas_count=Count('venta_items', filter=completed_filter),
            ingreso_total=Sum('venta_items__precio_total',
                              filter=completed_filter),
            vendidos_total=Sum('venta_items__cantidad',
                               filter=completed_filter),
            ultima_venta=Max('venta_items__venta__fecha',
                             filter=completed_filter)
        ).order_by('-id')
    permission_classes = [IsGerenteOrReadOnly]


class Ventas_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo de Ventas"""
    queryset = Ventas.objects.all()
    serializer_class = Ventas_Serializers

    def get_queryset(self):
        # Evitar N+1: traer cliente y items + producto de cada item
        return Ventas.objects.select_related('cliente').prefetch_related('items__producto').order_by('-fecha')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class Tasa_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Tasa."""
    queryset = Tasa.objects.all().order_by('-fecha')
    serializer_class = Tasa_Serializers
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class StoreViewSet(viewsets.ModelViewSet):
    """CRUD para las tiendas (Store). Cada usuario administra sus propias tiendas."""
    # Requerimos autenticación para crear/editar; lectura es pública.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = StoreSerializer

    def get_queryset(self):
        # Mostrar solo las tiendas del usuario autenticado
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated:
            return Store.objects.filter(owner=user).order_by('-creado_en')
        return Store.objects.none()

    def perform_create(self, serializer):
        store = serializer.save(owner=self.request.user)
        try:
            logging.getLogger(__name__).info(
                f"Store created id={store.id} owner={getattr(self.request.user, 'username', None)} api_url={store.api_url}")
        except Exception:
            pass
        # Al crear una tienda, establecerla como tienda seleccionada del perfil
        try:
            profile, _ = UserProfile.objects.get_or_create(
                user=self.request.user)
            profile.selected_store = store
            profile.save(update_fields=['selected_store'])
        except Exception:
            pass

    def create(self, request, *args, **kwargs):
        """Crear una tienda.

        - Normaliza `api_url` si el usuario no incluyó el esquema (añade https://).
        - Devuelve errores de validación claros cuando corresponda.
        - Requiere usuario autenticado.
        """
        user = getattr(request, 'user', None)
        try:
            logging.getLogger(__name__).info(
                f"Store create called by user={getattr(user, 'username', None)} data={dict(request.data or {})}")
        except Exception:
            pass
        if not (user and getattr(user, 'is_authenticated', False)):
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data.copy() if request.data is not None else {}
        api_url = data.get('api_url') or data.get('apiUrl') or ''
        if isinstance(api_url, str) and api_url and not api_url.startswith(('http://', 'https://')):
            # Prepend https:// for convenience (frontend users often escriben dominio sin esquema)
            data['api_url'] = f'https://{api_url}'

        serializer = self.get_serializer(data=data)
        # Validación explícita: registrar errores para facilitar debugging
        if not serializer.is_valid():
            try:
                logging.getLogger(__name__).warning(
                    f"Store serializer invalid: {serializer.errors}")
            except Exception:
                pass
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Llamar a perform_create para aplicar la lógica existente (owner + profile)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class RecomendacionIA_ViewSet(viewsets.ModelViewSet):
    queryset = RecomendacionIA.objects.all()
    serializer_class = RecomendacionIA_Serializers
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Solo superuser y Gerente pueden generar (crear) recomendaciones
        user = getattr(request, 'user', None)
        if not (getattr(user, 'is_superuser', False) or _user_in_group(user, 'Gerente')):
            return Response({'detail': 'No tiene permiso para generar recomendaciones IA.'}, status=status.HTTP_403_FORBIDDEN)
        """Permite autocompletar el producto desde metadatos/card cuando no viene explícito."""
        data = request.data.copy() if request.data else {}

        # Si falta producto, intentar extraerlo de metadatos.card.product_id o metadatos.debug.best_option.product_focus.id
        if not data.get('producto'):
            meta = data.get('metadatos') or {}
            try:
                if isinstance(meta, str):
                    import json
                    meta = json.loads(meta)
            except Exception:
                meta = {}

            product_id = None
            try:
                product_id = meta.get('card', {}).get('product_id')
            except Exception:
                product_id = None
            if not product_id:
                try:
                    product_id = meta.get('debug', {}).get(
                        'best_option', {}).get('product_focus', {}).get('id')
                except Exception:
                    product_id = None
            if product_id:
                data['producto'] = product_id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class VentaItem_ViewSet(viewsets.ModelViewSet):
    queryset = VentaItem.objects.all()
    serializer_class = VentaItem_Serializers
    permission_classes = [permissions.IsAuthenticated]


class RegisterView(generics.CreateAPIView):
    """Endpoint para registrar un nuevo usuario."""
    queryset = get_user_model().objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer


class AIRecommendationsView(APIView):
    """Genera recomendaciones de marketing y stock usando Gemini.

    Request (POST):
    {
      "product_ids": [1,2],  # opcional
      "category": "Electrónica",  # opcional
      "limit": 3  # opcional, max productos a considerar
    }
    """

    def post(self, request):
        """Genera una recomendación IA usando Gemini con los filtros recibidos.

        Body JSON (opcional):
        {
          "product_ids": [int,...],
          "category": str,
          "limit": int
        }
        """
        data = request.data or {}

        # Limpiar/normalizar parámetros de entrada
        product_ids = data.get('product_ids')
        if isinstance(product_ids, (list, tuple)):
            try:
                product_ids = [int(pid) for pid in product_ids]
            except Exception:
                product_ids = None
        else:
            product_ids = None

        category = data.get('category')
        try:
            category = str(category).strip() if category is not None else None
        except Exception:
            category = None

        limit = data.get('limit')
        try:
            limit = int(limit) if limit is not None else None
        except Exception:
            limit = None

        # Permisos: solo superuser y Gerente pueden generar recomendaciones
        user = getattr(request, 'user', None)
        if not (getattr(user, 'is_superuser', False) or _user_in_group(user, 'Gerente')):
            return Response({'detail': 'No tiene permiso para generar recomendaciones IA.'}, status=status.HTTP_403_FORBIDDEN)

        # Invocar servicio Gemini
        try:
            payload = {
                'product_ids': product_ids,
                'category': category,
                'limit': limit,
            }
            result = generate_ai_recommendation(**payload)
            return Response(result, status=status.HTTP_200_OK)
        except GeminiError as ge:
            return Response({'error': str(ge)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'error': f'Error al generar recomendación: {exc}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductsGrowthView(APIView):
    """Productos con mayor crecimiento reciente.

    Calcula crecimiento de ingresos por producto entre los últimos N días y el periodo previo.
    Parámetros: ?days=30 (ventana actual), ?limit=10
    Response: [{ producto_id, producto, revenue_now, revenue_prev, growth_pct }]
    """

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        today = timezone.now()
        start_now = today - datetime.timedelta(days=days)
        start_prev = start_now - datetime.timedelta(days=days)

        # Ventana actual
        items_now = (
            VentaItem.objects.select_related('producto', 'venta')
            .filter(venta__estado=Ventas.ESTADO_COMPLETADA, venta__fecha__gte=start_now, venta__fecha__lte=today)
            .values('producto__id', 'producto__nombre')
            .annotate(revenue=Sum('precio_total'))
        )
        now_map = {it['producto__id']: float(
            it.get('revenue') or 0) for it in items_now}

        # Ventana previa
        items_prev = (
            VentaItem.objects.select_related('producto', 'venta')
            .filter(venta__estado=Ventas.ESTADO_COMPLETADA, venta__fecha__gte=start_prev, venta__fecha__lt=start_now)
            .values('producto__id', 'producto__nombre')
            .annotate(revenue=Sum('precio_total'))
        )
        prev_map = {it['producto__id']: float(
            it.get('revenue') or 0) for it in items_prev}

        rows = []
        product_names = {it['producto__id']
            : it['producto__nombre'] for it in items_now}
        product_names.update(
            {it['producto__id']: it['producto__nombre'] for it in items_prev})

        for pid, rev_now in now_map.items():
            rev_prev = prev_map.get(pid, 0.0)
            if rev_prev > 0:
                growth = ((rev_now - rev_prev) / rev_prev) * 100
            else:
                growth = 100.0 if rev_now > 0 else 0.0
            projected_revenue = rev_now * (1 + max(growth, 0) / 100)
            rows.append({
                'producto_id': pid,
                'producto': product_names.get(pid) or f'Producto {pid}',
                'revenue_now': round(rev_now, 2),
                'revenue_prev': round(rev_prev, 2),
                'growth_pct': round(growth, 1),
                'projected_revenue': round(projected_revenue, 2),
            })

        rows = [r for r in rows if r['growth_pct'] > 0]
        rows = sorted(rows, key=lambda x: x['growth_pct'], reverse=True)[
            :max(1, limit)]

        # Saneamiento de nombres de producto: remover códigos tipo "-XX-###" y espacios extra
        try:
            import re as _re
            for r in rows:
                pname = r.get('producto') or ''
                pname = _re.sub(r"\s*-?[A-Za-z0-9]{2,3}-###\s*", " ", pname)
                pname = _re.sub(r"\s+", " ", pname).strip()
                r['producto'] = pname
        except Exception:
            pass

        return Response(rows)


class RevenueByCategoryView(APIView):
    """Devuelve ingresos y costo por categoría en una ventana de días."""

    def get(self, request):
        from datetime import timedelta

        month_param = request.query_params.get('month')
        anchor_now = timezone.now()

        if month_param:
            try:
                year_str, mon_str = month_param.split('-')
                year = int(year_str)
                mon = int(mon_str)
                start = timezone.datetime(year=year, month=mon, day=1)
                if mon == 12:
                    end = timezone.datetime(year=year + 1, month=1, day=1)
                else:
                    end = timezone.datetime(year=year, month=mon + 1, day=1)
            except Exception:
                start = anchor_now - timedelta(days=30)
                end = anchor_now
        else:
            try:
                days = int(request.query_params.get('days', 30))
            except Exception:
                days = 30
            end = anchor_now
            start = end - timedelta(days=days)

        qs = (
            VentaItem.objects.select_related('venta', 'producto')
            .filter(venta__estado=Ventas.ESTADO_COMPLETADA, venta__fecha__gte=start, venta__fecha__lt=end)
        )

        cost_expr = ExpressionWrapper(
            F('cantidad') * F('producto__costo'), output_field=DecimalField(max_digits=14, decimal_places=2)
        )

        agg = (
            qs.values(cat=F('producto__categoria'))
            .annotate(revenue=Sum('precio_total'), cost=Sum(cost_expr))
            .order_by('-revenue')
        )

        data = []
        for row in agg:
            revenue = float(row.get('revenue') or 0)
            cost = float(row.get('cost') or 0)
            margin_pct = ((revenue - cost) / revenue *
                          100) if revenue > 0 else 0.0
            data.append({
                'category': row.get('cat') or 'Sin categoría',
                'revenue': revenue,
                'cost': cost,
                'margin_pct': round(margin_pct, 1),
            })

        return Response(data)


class ExportCostTemplateView(View):
    """Exporta una plantilla CSV con nombres de productos y columna 'costo' vacía."""

    def get(self, request):
        # Sólo superuser o Gerente pueden exportar plantilla de costos
        user = getattr(request, 'user', None)
        if not (getattr(user, 'is_superuser', False) or _user_in_group(user, 'Gerente')):
            return JsonResponse({'detail': 'No tiene permiso para acceder a esta plantilla.'}, status=status.HTTP_403_FORBIDDEN)

        products = Productos.objects.all().order_by('nombre')
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(['nombre', 'costo'])
        for p in products:
            writer.writerow([p.nombre, ''])
        resp = HttpResponse(buffer.getvalue(), content_type='text/csv')
        now = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        resp['Content-Disposition'] = f'attachment; filename="plantilla_costos_{now}.csv"'
        return resp


class ImportCostsView(APIView):
    """Importa costos desde un CSV con columnas: nombre,costo."""

    def post(self, request):
        user = getattr(request, 'user', None)
        if not (getattr(user, 'is_superuser', False) or _user_in_group(user, 'Gerente')):
            return Response({'detail': 'No tiene permiso para importar costos.'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file') or request.FILES.get('csv')
        if not file:
            return Response({'detail': 'Archivo CSV no recibido (use campo "file").'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            import io as _io
            decoded = _io.TextIOWrapper(file.file, encoding='utf-8')
            reader = csv.DictReader(decoded)
        except Exception as exc:
            return Response({'detail': f'CSV inválido: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

        updated = 0
        errors = []
        for idx, row in enumerate(reader, start=2):  # header is line 1
            name = (row.get('nombre') or row.get('producto') or '').strip()
            costo_raw = (row.get('costo') or row.get('precio') or '').strip()
            if not name:
                errors.append(f'Fila {idx}: falta nombre')
                continue
            if costo_raw == '':
                # vacío: ignorar (permite dejar sin costo)
                continue
            # normalizar separadores decimales
            costo_norm = costo_raw.replace(',', '.')
            from decimal import Decimal, InvalidOperation
            try:
                costo_val = Decimal(costo_norm)
            except InvalidOperation:
                errors.append(f'Fila {idx}: costo inválido "{costo_raw}"')
                continue
            qs = Productos.objects.filter(nombre=name)
            if not qs.exists():
                errors.append(f'Fila {idx}: producto "{name}" no encontrado')
                continue
            # actualizar todos los coincidientes por nombre (según requerimiento de plantilla por nombre)
            for p in qs:
                p.costo = costo_val
                p.save(update_fields=['costo'])
                updated += 1

        return Response({'updated': updated, 'errors': errors})


class QuantityByCategoryView(APIView):
    """Devuelve la cantidad total vendida por categoría.

    Response: [{ category: 'Alimentos', units: 123 }, ...]
    """

    def get(self, request):
        # Considerar solo items de ventas completadas para consistencia
        qs = VentaItem.objects.select_related('producto', 'venta').filter(
            venta__estado=Ventas.ESTADO_COMPLETADA)
        agg = (
            qs.values(cat=F('producto__categoria'))
            .annotate(units=Sum('cantidad'))
            .order_by('-units')
        )
        data = []
        for item in agg:
            units = int(item['units'] or 0)
            data.append({'category': item['cat']
                        or 'Sin categoría', 'units': units})
        return Response(data)


class TopProductsView(APIView):
    """Devuelve los productos top por ingresos y unidades vendidas.

    Query params: ?limit=5
    Response: [{ producto: 'Nombre', ventas: 1234.5, unidades: 20 }, ...]
    """

    def get(self, request):
        limit = int(request.query_params.get('limit', 5))
        # Allow choosing sort order: by units sold ('units') or by revenue ('revenue')
        sort = request.query_params.get('sort', 'units')
        # Group by producto id to avoid collisions on identical names
        qs = (
            VentaItem.objects.select_related('producto', 'venta')
            .filter(venta__estado=Ventas.ESTADO_COMPLETADA)
            .values(producto_pk=F('producto__id'), name=F('producto__nombre'))
            .annotate(ventas=Sum('precio_total'), unidades=Sum('cantidad'))
        )
        if sort == 'revenue':
            qs = qs.order_by('-ventas')[:limit]
        else:
            qs = qs.order_by('-unidades')[:limit]
        data = []
        for item in qs:
            data.append({'producto_id': item.get('producto_pk'), 'producto': item['name'], 'ventas': float(
                item['ventas'] or 0), 'unidades': int(item['unidades'] or 0)})
        return Response(data)


class CustomersMonthlyView(APIView):
    """Devuelve clientes nuevos vs recurrentes por mes.

    Response: [{ month: 'Ene', nuevos: 12, recurrentes: 34 }, ...]
    - nuevos: clientes con fecha_registro en el mes
    - recurrentes: clientes que realizaron ventas en el mes y se registraron antes del inicio del mes
    """

    def get(self, request):
        months = int(request.query_params.get('months', 7))
        today = timezone.now().date()
        year = today.year
        month = today.month
        months_list = []
        for i in range(months - 1, -1, -1):
            m = month - i
            y = year
            while m <= 0:
                m += 12
                y -= 1
            months_list.append((y, m))

        data = []
        for y, m in months_list:
            start = timezone.datetime(year=y, month=m, day=1)
            if m == 12:
                end = timezone.datetime(year=y + 1, month=1, day=1)
            else:
                end = timezone.datetime(year=y, month=m + 1, day=1)

            nuevos = Clientes.objects.filter(
                fecha_registro__year=y, fecha_registro__month=m).count()
            # recurrentes: clientes que hicieron ventas en periodo y se registraron antes de start
            recurrentes = Ventas.objects.filter(
                fecha__gte=start, fecha__lt=end, cliente__fecha_registro__lt=start).values('cliente').distinct().count()
            label = MONTH_LABELS_ES[m - 1]
            data.append({'month': label, 'nuevos': nuevos,
                        'recurrentes': recurrentes})

        return Response(data)


class TopCustomersMonthlyView(APIView):
    """Devuelve los top N clientes por gasto total y su gasto por mes.

    Response:
    {
      "months": ["Ene", "Feb", ...],
      "series": [ { "cliente_id": 1, "cliente": "Nombre", "monthly": [..], "total": 123 }, ... ]
    }
    """

    def get(self, request):
        from django.db.models.functions import TruncMonth

        months = int(request.query_params.get('months', 12))
        limit = int(request.query_params.get('limit', 5))
        year_param = request.query_params.get('year')

        today = timezone.now().date()
        if year_param:
            try:
                target_year = int(year_param)
            except Exception:
                target_year = today.year
        else:
            target_year = None

        months_list = []
        months_keys = []

        if target_year:
            # Full calendar year of the selected year
            for m in range(1, 13):
                months_list.append((target_year, m))
        else:
            # Rolling window backwards from today
            year = today.year
            month = today.month
            for i in range(months - 1, -1, -1):
                m = month - i
                y = year
                while m <= 0:
                    m += 12
                    y -= 1
                months_list.append((y, m))

        for y, m in months_list:
            months_keys.append(timezone.datetime(
                year=y, month=m, day=1).date())
        months_labels = [MONTH_LABELS_ES[d.month - 1] for d in months_keys]
        months_iso = [f"{d.year:04d}-{d.month:02d}" for d in months_keys]

        # Limit top customers within the selected year/window
        sales_filter = Q(estado=Ventas.ESTADO_COMPLETADA)
        if target_year:
            start_year = timezone.datetime(
                year=target_year, month=1, day=1).date()
            end_year = timezone.datetime(
                year=target_year + 1, month=1, day=1).date()
            sales_filter &= Q(fecha__gte=start_year, fecha__lt=end_year)

        top_qs = (
            Ventas.objects.filter(sales_filter)
            .values(cliente_pk=F('cliente__id'), cliente_name=F('cliente__nombre'))
            .annotate(total_spent=Sum('precio_total'))
            .order_by('-total_spent')
        )
        top_list = list(top_qs[:limit])
        top_ids = [item['cliente_pk'] for item in top_list]

        monthly_qs = (
            Ventas.objects.filter(sales_filter, cliente__id__in=top_ids)
            .annotate(m=TruncMonth('fecha'))
            .values('cliente__id', 'cliente__nombre', 'm')
            .annotate(month_spent=Sum('precio_total'))
            .order_by('cliente__id', 'm')
        )

        monthly_map = {}
        for it in monthly_qs:
            cid = it.get('cliente__id')
            mdate = it.get('m').date() if it.get('m') is not None else None
            if cid is None or mdate is None:
                continue
            monthly_map.setdefault(cid, {})[mdate] = float(
                it.get('month_spent') or 0)

        series = []
        for item in top_list:
            cid = item.get('cliente_pk')
            name = item.get('cliente_name') or f'Cliente {cid}'
            monthly_values = [float(monthly_map.get(
                cid, {}).get(d, 0.0)) for d in months_keys]
            total = sum(monthly_values)
            series.append({'cliente_id': cid, 'cliente': name,
                          'monthly': monthly_values, 'total': float(total)})

        return Response({'months': months_labels, 'months_iso': months_iso, 'series': series})


class TopCategoriesMonthlyView(APIView):
    """Devuelve los top N categorias por unidades vendidas y su desglose mensual.

    Response:
    { "months": [...], "series": [{"category": "X", "monthly": [...], "total": 123}, ...] }
    """

    def get(self, request):
        from django.db.models.functions import TruncMonth

        months = int(request.query_params.get('months', 12))
        limit = int(request.query_params.get('limit', 6))
        today = timezone.now().date()
        year = today.year
        month = today.month
        months_list = []
        months_keys = []
        for i in range(months - 1, -1, -1):
            m = month - i
            y = year
            while m <= 0:
                m += 12
                y -= 1
            months_list.append((y, m))

        for y, m in months_list:
            months_keys.append(timezone.datetime(
                year=y, month=m, day=1).date())
        months_labels = [MONTH_LABELS_ES[d.month - 1] for d in months_keys]

        qs = (
            VentaItem.objects.select_related('venta', 'producto')
            .filter(venta__estado=Ventas.ESTADO_COMPLETADA)
            .values(cat=F('producto__categoria'))
            .annotate(total_units=Sum('cantidad'))
            .order_by('-total_units')
        )
        top_list = list(qs[:limit])
        top_cats = [item.get('cat') for item in top_list]

        monthly_qs = (
            VentaItem.objects.select_related('venta', 'producto')
            .filter(venta__estado=Ventas.ESTADO_COMPLETADA, producto__categoria__in=top_cats)
            .annotate(m=TruncMonth('venta__fecha'))
            .values('producto__categoria', 'm')
            .annotate(month_units=Sum('cantidad'))
            .order_by('producto__categoria', 'm')
        )

        monthly_map = {}
        for it in monthly_qs:
            cat = it.get('producto__categoria') or 'Sin categoría'
            mdate = it.get('m').date() if it.get('m') is not None else None
            if mdate is None:
                continue
            monthly_map.setdefault(cat, {})[mdate] = int(
                it.get('month_units') or 0)

        series = []
        for item in top_list:
            cat = item.get('cat') or 'Sin categoría'
            monthly_values = [int(monthly_map.get(cat, {}).get(d, 0))
                              for d in months_keys]
            total = sum(monthly_values)
            series.append(
                {'category': cat, 'monthly': monthly_values, 'total': int(total)})

        return Response({'months': months_labels, 'series': series})


class ReturningCustomersRateView(APIView):
    """Calcula el porcentaje de clientes que vuelven a comprar en una ventana."""

    def get(self, request):
        from datetime import timedelta

        try:
            days = int(request.query_params.get('days', 90))
        except Exception:
            days = 90

        now = timezone.now()
        start = now - timedelta(days=days)

        # Compras en ventana
        window_qs = Ventas.objects.filter(
            estado=Ventas.ESTADO_COMPLETADA,
            fecha__gte=start,
            fecha__lte=now,
        )

        total_buyers = window_qs.values('cliente_id').distinct().count()

        # Clientes que ya habían comprado antes de la ventana
        prev_buyers = (
            Ventas.objects.filter(
                estado=Ventas.ESTADO_COMPLETADA,
                fecha__lt=start,
            )
            .values_list('cliente_id', flat=True)
            .distinct()
        )

        returning_buyers = window_qs.filter(
            cliente_id__in=prev_buyers).values('cliente_id').distinct().count()

        rate = (returning_buyers / total_buyers *
                100) if total_buyers > 0 else 0.0

        return Response({
            'rate': round(rate, 1),
            'total_buyers': total_buyers,
            'returning_buyers': returning_buyers,
            'days': days,
        })


class SalesHeatmapView(APIView):
    """Devuelve una matriz tipo calendario (semanas x 7) con la intensidad relativa de ventas por día del mes.

    Response: {
      "heatmap": [[int,...], ...],   # filas = semanas (1..6), columnas = Lun..Dom (7)
      "day_numbers": [[int_or_0,...], ...], # misma forma, contiene número de día o 0 para celdas vacías
      "month": "YYYY-MM"
    }

    Parámetros:
    - month=YYYY-MM (por ejemplo 2025-11) (obligatorio)

    Si faltan o son inválidos, se retorna una matriz de ceros con day_numbers a 0.
    """

    def get(self, request):
        from django.utils import timezone
        from datetime import datetime, timedelta
        import calendar

        month_param = request.query_params.get('month')

        try:
            if not month_param:
                raise ValueError('month required')
            year_str, mon_str = month_param.split('-')
            year = int(year_str)
            mon = int(mon_str)
            # compute start and end of month
            start = datetime(year=year, month=mon, day=1)
            if mon == 12:
                next_month = datetime(year=year + 1, month=1, day=1)
            else:
                next_month = datetime(year=year, month=mon + 1, day=1)
            # number of days in month
            last_day = calendar.monthrange(year, mon)[1]
        except Exception:
            # invalid params -> return zeros (6 weeks x 7 days)
            heatmap = [[0 for _ in range(7)] for _ in range(6)]
            day_nums = [[0 for _ in range(7)] for _ in range(6)]
            return Response({"heatmap": heatmap, "day_numbers": day_nums, "month": month_param or ""})

        # fetch completed sales in the month
        qs = Ventas.objects.filter(
            estado=Ventas.ESTADO_COMPLETADA, fecha__gte=start, fecha__lt=next_month)

        # weekday of first day (0=Mon .. 6=Sun)
        first_wd = start.weekday()
        # number of weeks to represent (ceil((first_wd + last_day)/7)) up to 6
        weeks = (first_wd + last_day + 6) // 7
        weeks = max(4, min(6, weeks))

        # initialize counts and day_numbers
        counts = [[0 for _ in range(7)] for _ in range(weeks)]
        day_nums = [[0 for _ in range(7)] for _ in range(weeks)]

        # fill day_nums mapping
        for w in range(weeks):
            for wd in range(7):
                pos = w * 7 + wd
                day_num = pos - first_wd + 1
                if 1 <= day_num <= last_day:
                    day_nums[w][wd] = day_num

        # aggregate revenue per day using VentaItem (more reliable for revenue)
        from django.db.models.functions import TruncDate

        items_qs = VentaItem.objects.select_related('venta').filter(
            venta__estado=Ventas.ESTADO_COMPLETADA, venta__fecha__gte=start, venta__fecha__lt=next_month)
        items_by_date = (
            items_qs.annotate(d=TruncDate('venta__fecha'))
            .values('d')
            .annotate(revenue=Sum('precio_total'), items_count=Count('id'), ventas_count=Count('venta', distinct=True))
        )

        # map date -> revenue
        rev_map = {}
        for it in items_by_date:
            dt = it['d']
            if dt is None:
                continue
            rev_map[dt.day] = float(it.get('revenue') or 0)

        # fill revenue matrix with revenue per day (preserve cents)
        revenue_matrix = [[0.0 for _ in range(7)] for _ in range(weeks)]
        for w in range(weeks):
            for wd in range(7):
                day_num = day_nums[w][wd]
                if day_num:
                    # keep as float to preserve decimals
                    revenue_matrix[w][wd] = float(rev_map.get(day_num, 0))

        # normalize by max revenue (to 0-100)
        maxi = max((revenue_matrix[r][c] for r in range(weeks)
                   for c in range(7)), default=0)
        if maxi <= 0:
            heatmap = [[0 for _ in range(7)] for _ in range(weeks)]
        else:
            heatmap = [[int((revenue_matrix[r][c] / maxi) * 100)
                        for c in range(7)] for r in range(weeks)]

        return Response({"heatmap": heatmap, "day_numbers": day_nums, "revenue_raw": revenue_matrix, "month": f"{year:04d}-{mon:02d}"})


class ExportMixin:
    """Helper mixin to fetch products queryset based on request params."""

    ALLOWED_COUNTS = {10, 25, 50, 100, 250, 500, 1000}

    def get_products_qs(self, request):
        from .models import Productos
        qs = Productos.objects.all().order_by('-id')
        # Django `View` provides `request.GET`; DRF `Request` exposes `query_params`.
        params = getattr(request, 'GET', None) or getattr(
            request, 'query_params', None) or {}
        # Accept multiple possible parameter names and provide a sensible default
        raw = (params.get('count') or params.get(
            'limit') or params.get('n') or '').strip()

        # Default behaviour: last 10
        if raw == '' or raw.lower() == '10':
            return qs[:10]

        if raw.lower() == 'all':
            return qs

        try:
            n = int(raw)
        except Exception:
            return qs[:10]

        if n in self.ALLOWED_COUNTS:
            return qs[:n]

        # If an unexpected but valid positive integer was supplied, return that many.
        if n > 0:
            return qs[:n]

        return qs[:10]

    def get_clients_qs(self, request):
        from .models import Clientes
        qs = Clientes.objects.all().order_by('-id')
        params = getattr(request, 'GET', None) or getattr(
            request, 'query_params', None) or {}
        raw = (params.get('count') or params.get(
            'limit') or params.get('n') or '').strip()

        if raw == '' or raw.lower() == '10':
            return qs[:10]
        if raw.lower() == 'all':
            return qs
        try:
            n = int(raw)
        except Exception:
            return qs[:10]
        if n in self.ALLOWED_COUNTS:
            return qs[:n]
        if n > 0:
            return qs[:n]
        return qs[:10]


class ExportCSVView(View, ExportMixin):
    # Django View to avoid DRF content-negotiation rejecting CSV Accept header
    def get(self, request):
        # currently only supports tipo=productos
        params = getattr(request, 'GET', None) or getattr(
            request, 'query_params', None) or {}
        tipo = params.get('tipo', 'productos')

        # choose entity
        if tipo == 'productos':
            qs = self.get_products_qs(request)
            from .models import Productos
            fields = [f.name for f in Productos._meta.fields]
            entity_label = 'productos'
        elif tipo == 'clientes':
            qs = self.get_clients_qs(request)
            from .models import Clientes
            fields = [f.name for f in Clientes._meta.fields]
            entity_label = 'clientes'
        elif tipo == 'ventas':
            # for ventas we expect date_from/date_to params
            params = getattr(request, 'GET', None) or getattr(
                request, 'query_params', None) or {}
            from django.utils.dateparse import parse_datetime, parse_date
            df = params.get('date_from')
            dt = params.get('date_to')
            start = end = None
            if df or dt:
                if not (df and dt):
                    return JsonResponse({'detail': 'date_from and date_to are required together when filtering ventas'}, status=status.HTTP_400_BAD_REQUEST)

                start = parse_datetime(df) or parse_date(df)
                end = parse_datetime(dt) or parse_date(dt)
                if start is None or end is None:
                    return JsonResponse({'detail': 'Invalid date_from/date_to format. Use ISO datetime.'}, status=status.HTTP_400_BAD_REQUEST)

                # If parsed dates are date objects, convert to datetimes at boundaries
                import datetime as _dt
                if isinstance(start, _dt.date) and not isinstance(start, _dt.datetime):
                    start = _dt.datetime.combine(start, _dt.time.min)
                if isinstance(end, _dt.date) and not isinstance(end, _dt.datetime):
                    end = _dt.datetime.combine(end, _dt.time.max)

            from .models import Ventas
            qs = Ventas.objects.select_related(
                'cliente').prefetch_related('items__producto')
            if start and end:
                qs = qs.filter(fecha__gte=start, fecha__lte=end)
            qs = qs.order_by('-fecha')
            max_items = qs.annotate(items_cnt=Count('items')).aggregate(
                max=Max('items_cnt'))['max'] or 0
            extra_product_fields = [f'producto_{i}'
                                    for i in range(1, max_items + 1)]
            fields = ['id', 'fecha', 'cliente_id', 'cliente_nombre',
                      'precio_total', 'metodo_compra', 'estado', *extra_product_fields]
            entity_label = 'ventas'
        else:
            return JsonResponse({'detail': 'tipo no soportado'}, status=status.HTTP_400_BAD_REQUEST)

        # prepare CSV
        buffer = io.StringIO()
        writer = csv.writer(buffer)

        # header: field names
        writer.writerow(fields)

        for obj in qs:
            row = []
            # cache items/product names once per venta row to avoid repeated loops
            items_cache = None
            product_names = None

            for fname in fields:
                # support computed ventas fields
                if entity_label == 'ventas':
                    if fname == 'cliente_id':
                        val = getattr(obj, 'cliente_id', '')
                    elif fname == 'cliente_nombre':
                        cli = getattr(obj, 'cliente', None)
                        val = f"{getattr(cli, 'nombre', '')} {getattr(cli, 'apellido', '')}" if cli else ''
                    elif fname.startswith('producto_'):
                        if product_names is None:
                            if items_cache is None:
                                try:
                                    items_cache = list(obj.items.all())
                                except Exception:
                                    items_cache = []
                            product_names = [getattr(getattr(i, 'producto', None), 'nombre', '')
                                             for i in items_cache]
                        try:
                            idx = int(fname.rsplit('_', 1)[1]) - 1
                        except Exception:
                            idx = -1
                        val = product_names[idx] if 0 <= idx < len(
                            product_names) else ''
                    else:
                        val = getattr(obj, fname, '')
                else:
                    val = getattr(obj, fname, '')

                # format datetimes/decimals
                if isinstance(val, (datetime.date, datetime.datetime)):
                    val = val.isoformat()
                # normalize blanks
                if val is None or val == '' or (isinstance(val, str) and val.strip() == ''):
                    row.append('N/A')
                else:
                    row.append(str(val))
            writer.writerow(row)

        resp = HttpResponse(buffer.getvalue(), content_type='text/csv')
        now = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        resp['Content-Disposition'] = f'attachment; filename="{entity_label}_{now}.csv"'
        return resp


class ExportPDFView(View, ExportMixin):
    # Django View to avoid DRF content-negotiation rejecting PDF Accept header
    def get(self, request):
        # Requerir autenticación
        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return JsonResponse({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        params = getattr(request, 'GET', None) or getattr(
            request, 'query_params', None) or {}
        tipo = params.get('tipo', 'productos')

        # choose entity
        if tipo == 'productos':
            qs = self.get_products_qs(request)
            products = []
            for p in qs:
                products.append({
                    'id': p.id,
                    'nombre': p.nombre or 'N/A',
                    'categoria': p.categoria or 'N/A',
                    'precio': p.precio if p.precio not in [None, ''] else 0,
                    'stock': p.stock if getattr(p, 'stock', None) not in [None, ''] else 0,
                    'costo': getattr(p, 'costo', None) if getattr(p, 'costo', None) not in [None, ''] else 0,
                })
            context = {'products': products, 'now': datetime.datetime.utcnow()}
            template_name = 'report_products.html'
            entity_label = 'productos'
        elif tipo == 'clientes':
            qs = self.get_clients_qs(request)
            clients = []
            for c in qs:
                clients.append({
                    'id': c.id,
                    'nombre': c.nombre or 'N/A',
                    'apellido': c.apellido or 'N/A',
                    'correo': c.correo or 'N/A',
                    'telefono': c.telefono or 'N/A',
                    'fecha_registro': c.fecha_registro.isoformat() if c.fecha_registro else 'N/A',
                    'tipo_cliente': getattr(c, 'tipo_cliente', None) or 'N/A',
                })
            context = {'clients': clients, 'now': datetime.datetime.utcnow()}
            template_name = 'report_clients.html'
            entity_label = 'clientes'

        elif tipo == 'graficas':
            # Construir datos estáticos para las gráficas (sin iframe)
            from django.utils import timezone as _tz
            from datetime import timedelta as _td
            from .models import Ventas, VentaItem, Productos, Clientes

            # Ventana: últimos 6 meses para series mensuales
            today = _tz.now().date()
            year = today.year
            month = today.month
            months_list = []
            for i in range(6 - 1, -1, -1):
                m = month - i
                y = year
                while m <= 0:
                    m += 12
                    y -= 1
                months_list.append((y, m))

            monthly = []
            for y, m in months_list:
                start = _tz.datetime(year=y, month=m, day=1).date()
                if m == 12:
                    end = _tz.datetime(year=y + 1, month=1, day=1).date()
                else:
                    end = _tz.datetime(year=y, month=m + 1, day=1).date()

                qs_sales = Ventas.objects.filter(
                    fecha__gte=start,
                    fecha__lt=end,
                    estado=Ventas.ESTADO_COMPLETADA,
                )

                sales_sum = qs_sales.aggregate(
                    total=Sum('precio_total')).get('total') or 0
                sales_count = qs_sales.count()

                qs_items = VentaItem.objects.filter(venta__in=qs_sales)
                items_revenue = qs_items.aggregate(
                    total=Sum('precio_total')).get('total') or 0
                items_units = qs_items.aggregate(
                    total=Sum('cantidad')).get('total') or 0

                label = MONTH_LABELS_ES[m - 1]
                monthly.append({
                    'month': label,
                    'sales_sum': float(sales_sum),
                    'sales_count': sales_count,
                    'items_revenue': float(items_revenue),
                    'items_units': int(items_units or 0),
                })

            # Normalizar valores para usar en barras (0-100)
            max_sales_sum = max((it['sales_sum'] for it in monthly), default=0)
            max_sales_count = max((it['sales_count']
                                  for it in monthly), default=0)
            max_items_units = max((it['items_units']
                                  for it in monthly), default=0)
            for it in monthly:
                it['sales_sum_pct'] = int(
                    ((it['sales_sum'] / max_sales_sum) * 100) if max_sales_sum > 0 else 0)
                it['sales_count_pct'] = int(
                    ((it['sales_count'] / max_sales_count) * 100) if max_sales_count > 0 else 0)
                it['items_units_pct'] = int(
                    ((it['items_units'] / max_items_units) * 100) if max_items_units > 0 else 0)

            # Ingresos y margen por categoría en últimos 30 días
            start_30 = _tz.now() - _td(days=30)
            qs_cat_items = VentaItem.objects.select_related('venta', 'producto').filter(
                venta__estado=Ventas.ESTADO_COMPLETADA,
                venta__fecha__gte=start_30,
                venta__fecha__lte=_tz.now(),
            )
            cost_expr = ExpressionWrapper(
                F('cantidad') * F('producto__costo'), output_field=DecimalField(max_digits=14, decimal_places=2)
            )
            agg_cat = (
                qs_cat_items.values(cat=F('producto__categoria'))
                .annotate(revenue=Sum('precio_total'), cost=Sum(cost_expr))
                .order_by('-revenue')
            )
            categories = []
            for row in agg_cat:
                revenue = float(row.get('revenue') or 0)
                cost = float(row.get('cost') or 0)
                margin_pct = ((revenue - cost) / revenue *
                              100) if revenue > 0 else 0.0
                categories.append({
                    'category': row.get('cat') or 'Sin categoría',
                    'revenue': revenue,
                    'cost': cost,
                    'margin_pct': round(margin_pct, 1),
                })

            # Porcentaje relativo de ingresos por categoría (0-100)
            max_rev = max((c['revenue'] for c in categories), default=0)
            for c in categories:
                c['revenue_pct'] = int(
                    ((c['revenue'] / max_rev) * 100) if max_rev > 0 else 0)

            # Top productos por unidades en últimos 30 días
            qs_tp_items = VentaItem.objects.select_related('producto', 'venta').filter(
                venta__estado=Ventas.ESTADO_COMPLETADA,
                venta__fecha__gte=start_30,
                venta__fecha__lte=_tz.now(),
            ).values(name=F('producto__nombre')).annotate(units=Sum('cantidad')).order_by('-units')[:10]
            top_products = [{'producto': r['name'], 'unidades': int(
                r['units'] or 0)} for r in qs_tp_items]

            # Heatmap del mes actual (intensidad por día)
            import calendar as _cal
            start_month = _tz.datetime(year=year, month=month, day=1)
            if month == 12:
                next_month = _tz.datetime(year=year + 1, month=1, day=1)
            else:
                next_month = _tz.datetime(year=year, month=month + 1, day=1)
            last_day = _cal.monthrange(year, month)[1]
            first_wd = start_month.weekday()
            weeks = (first_wd + last_day + 6) // 7
            weeks = max(4, min(6, weeks))
            day_nums = [[0 for _ in range(7)] for _ in range(weeks)]
            for w in range(weeks):
                for wd in range(7):
                    pos = w * 7 + wd
                    dn = pos - first_wd + 1
                    if 1 <= dn <= last_day:
                        day_nums[w][wd] = dn
            items_qs = VentaItem.objects.select_related('venta').filter(
                venta__estado=Ventas.ESTADO_COMPLETADA, venta__fecha__gte=start_month, venta__fecha__lt=next_month)
            from django.db.models.functions import TruncDate
            items_by_date = (
                items_qs.annotate(d=TruncDate('venta__fecha'))
                .values('d')
                .annotate(revenue=Sum('precio_total'))
            )
            rev_map = {}
            for it in items_by_date:
                dt = it['d']
                if dt is None:
                    continue
                rev_map[dt.day] = float(it.get('revenue') or 0)
            revenue_matrix = [[0.0 for _ in range(7)] for _ in range(weeks)]
            for w in range(weeks):
                for wd in range(7):
                    dn = day_nums[w][wd]
                    if dn:
                        revenue_matrix[w][wd] = float(rev_map.get(dn, 0))
            maxi = max((revenue_matrix[r][c] for r in range(
                weeks) for c in range(7)), default=0)
            if maxi <= 0:
                heatmap = [[0 for _ in range(7)] for _ in range(weeks)]
            else:
                heatmap = [[int((revenue_matrix[r][c] / maxi) * 100)
                            for c in range(7)] for r in range(weeks)]

            # Métricas resumen
            total_products = Productos.objects.count()
            total_customers = Clientes.objects.count()
            total_sales_30 = Ventas.objects.filter(
                estado=Ventas.ESTADO_COMPLETADA, fecha__gte=start_30, fecha__lte=_tz.now()).aggregate(total=Sum('precio_total')).get('total') or 0

            context = {
                'now': datetime.datetime.utcnow(),
                'monthly': monthly,
                'categories': categories,
                'top_products': top_products,
                'heatmap': heatmap,
                'day_numbers': day_nums,
                'month_label': f"{year:04d}-{month:02d}",
                'summary': {
                    'total_products': total_products,
                    'total_customers': total_customers,
                    'total_sales_30': float(total_sales_30),
                },
            }
            template_name = 'report_graphs.html'
            entity_label = 'graficas'

        elif tipo == 'ventas':
            params = getattr(request, 'GET', None) or getattr(
                request, 'query_params', None) or {}
            from django.utils.dateparse import parse_datetime, parse_date
            df = params.get('date_from')
            dt = params.get('date_to')
            start = end = None
            if df or dt:
                if not (df and dt):
                    return JsonResponse({'detail': 'date_from and date_to are required together when filtering ventas'}, status=status.HTTP_400_BAD_REQUEST)

                start = parse_datetime(df) or parse_date(df)
                end = parse_datetime(dt) or parse_date(dt)
                if start is None or end is None:
                    return JsonResponse({'detail': 'Invalid date_from/date_to format. Use ISO datetime.'}, status=status.HTTP_400_BAD_REQUEST)

                import datetime as _dt
                if isinstance(start, _dt.date) and not isinstance(start, _dt.datetime):
                    start = _dt.datetime.combine(start, _dt.time.min)
                if isinstance(end, _dt.date) and not isinstance(end, _dt.datetime):
                    end = _dt.datetime.combine(end, _dt.time.max)

            from .models import Ventas
            qs = Ventas.objects.select_related(
                'cliente').prefetch_related('items__producto')
            if start and end:
                qs = qs.filter(fecha__gte=start, fecha__lte=end)
            qs = qs.order_by('-fecha')
            max_items = qs.annotate(items_cnt=Count('items')).aggregate(
                max=Max('items_cnt'))['max'] or 0
            product_headers = [
                f"Producto {i}" for i in range(1, max_items + 1)]

            sales_rows = []
            for v in qs:
                try:
                    items_list = list(v.items.all())
                except Exception:
                    items_list = []

                product_names = [getattr(getattr(it, 'producto', None), 'nombre', '')
                                 for it in items_list]
                # pad to max_items so table has consistent columns
                if max_items > len(product_names):
                    product_names.extend(
                        [''] * (max_items - len(product_names)))

                cliente_obj = getattr(v, 'cliente', None)
                cliente_nombre = f"{getattr(cliente_obj, 'nombre', '')} {getattr(cliente_obj, 'apellido', '')}".strip(
                )

                sales_rows.append({
                    'id': v.id,
                    'fecha': v.fecha,
                    'cliente': cliente_nombre or '-',
                    'precio_total': v.precio_total,
                    'metodo_compra': v.metodo_compra,
                    'estado': v.estado,
                    'productos': product_names,
                })

            context = {
                'sales': sales_rows,
                'product_headers': product_headers,
                'total_columns': 6 + len(product_headers),
                'now': datetime.datetime.utcnow(),
            }
            template_name = 'report_sales.html'
            entity_label = 'ventas'
        else:
            return JsonResponse({'detail': 'tipo no soportado'}, status=status.HTTP_400_BAD_REQUEST)

        # render HTML first
        html = render_to_string(template_name, context)

        # try to generate PDF with pdfkit (wkhtmltopdf) if available
        try:
            import pdfkit
            options = {
                'enable-local-file-access': None,
                'enable-javascript': None,
                'javascript-delay': '4000',
            }
            pdf = pdfkit.from_string(html, False, options=options)
            resp = HttpResponse(pdf, content_type='application/pdf')
            now = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            resp['Content-Disposition'] = f'attachment; filename="{entity_label}_{now}.pdf"'
            return resp
        except Exception:
            # fallback: return HTML and signal missing wkhtmltopdf
            resp = HttpResponse(html, content_type='text/html')
            resp['X-Wkhtmltopdf-Missing'] = '1'
            return resp


# DebugTotalsView removed per request


class StructuredMonthlyView(APIView):
    """JSON estructurado mensual para gráficas.

    Query params:
        - metric: revenue|units (default revenue)
        - n_months: número de meses (default 6)
    Respuesta: {
        dimension: "month",
        metric: "revenue"|"units",
        items: [{label: "YYYY-MM", value}],
        total: number
    }
    """

    def get(self, request):
        metric = request.query_params.get('metric', 'revenue')
        try:
            n_months = int(request.query_params.get('n_months', 6))
        except Exception:
            n_months = 6
        data = build_structured_output(
            'monthly', metric=metric, n_months=n_months)
        return Response(data)


class SalesMonthlyView(APIView):
    """Devuelve ventas agregadas por mes.

    Query params:
      - months: número de meses hacia atrás (default 6)

    Response: [
      { month: 'Ene', sales_sum, sales_count, items_revenue, items_count, items_units },
      ...
    ]
    """

    def get(self, request):
        try:
            months = int(request.query_params.get('months', 6))
        except Exception:
            months = 6

        year_param = request.query_params.get('year')
        today = timezone.now().date()
        if year_param:
            try:
                target_year = int(year_param)
            except Exception:
                target_year = today.year
        else:
            target_year = None

        year = today.year
        month = today.month
        months_list = []

        if target_year:
            # fixed calendar year
            for m in range(1, 13):
                months_list.append((target_year, m))
        else:
            # rolling window backwards
            for i in range(months - 1, -1, -1):
                m = month - i
                y = year
                while m <= 0:
                    m += 12
                    y -= 1
                months_list.append((y, m))

        data = []
        for y, m in months_list:
            start = timezone.datetime(year=y, month=m, day=1).date()
            if m == 12:
                end = timezone.datetime(year=y + 1, month=1, day=1).date()
            else:
                end = timezone.datetime(year=y, month=m + 1, day=1).date()

            qs_sales = Ventas.objects.filter(
                fecha__gte=start,
                fecha__lt=end,
                estado=Ventas.ESTADO_COMPLETADA,
            )

            sales_sum = qs_sales.aggregate(
                total=Sum('precio_total')).get('total') or 0
            sales_count = qs_sales.count()

            qs_items = VentaItem.objects.filter(venta__in=qs_sales)
            items_revenue = qs_items.aggregate(
                total=Sum('precio_total')).get('total') or 0
            items_count = qs_items.count()
            items_units = qs_items.aggregate(
                total=Sum('cantidad')).get('total') or 0

            label = MONTH_LABELS_ES[m - 1]
            month_iso = f"{y:04d}-{m:02d}"
            data.append({
                'month': month_iso,
                'month_label': label,
                'sales_sum': float(sales_sum),
                'sales_count': sales_count,
                'items_revenue': float(items_revenue),
                'items_count': items_count,
                'items_units': int(items_units or 0),
            })

        return Response(data)


class StructuredByProductView(APIView):
    """JSON estructurado por producto para gráficas.

    Query params:
        - metric: revenue|units (default revenue)
        - days: ventana en días (default 30)
        - limit: top N (opcional)
    Respuesta: {
        dimension: "product",
        metric: "revenue"|"units",
        window_days: number,
        items: [{id, name, category, value}],
        total: number
    }
    """

    def get(self, request):
        metric = request.query_params.get('metric', 'revenue')
        try:
            days = int(request.query_params.get('days', 30))
        except Exception:
            days = 30
        limit_raw = request.query_params.get('limit')
        try:
            limit = int(limit_raw) if limit_raw is not None else None
        except Exception:
            limit = None
        data = build_structured_output(
            'product', metric=metric, days=days, limit=limit)
        return Response(data)


class StructuredByCategoryView(APIView):
    """JSON estructurado por categoría para gráficas.

    Query params:
        - metric: revenue|units (default revenue)
        - days: ventana en días (default 30)
    Respuesta: {
        dimension: "category",
        metric: "revenue"|"units",
        window_days: number,
        items: [{category, value}],
        total: number
    }
    """

    def get(self, request):
        metric = request.query_params.get('metric', 'revenue')
        try:
            days = int(request.query_params.get('days', 30))
        except Exception:
            days = 30
        data = build_structured_output('category', metric=metric, days=days)
        return Response(data)


class ProfileView(APIView):
    """Obtiene/actualiza el perfil del usuario autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        avatar_url = None
        if profile.avatar_path:
            avatar_url = f"{settings.MEDIA_URL}{profile.avatar_path}"
        selected_store = None
        # Si el usuario no tiene tiendas, crear automáticamente la "Tienda 1"
        try:
            user_has_stores = Store.objects.filter(owner=user).exists()
        except Exception:
            user_has_stores = False

        if not user_has_stores:
            try:
                # Construir una URL base para la API de la tienda a partir de la petición
                api_candidate = request.build_absolute_uri('/api')
                api_candidate = api_candidate.rstrip('/')
                store, created = Store.objects.get_or_create(
                    owner=user,
                    api_url=api_candidate,
                    defaults={'name': 'Tienda 1'}
                )
                # establecer como tienda seleccionada
                profile.selected_store = store
                profile.save(update_fields=['selected_store'])
                selected_store = {'id': store.id,
                                  'name': store.name, 'api_url': store.api_url}
            except Exception:
                # si falla la creación, continuar sin interrumpir la vista
                selected_store = None
        else:
            try:
                if profile.selected_store:
                    selected_store = {
                        'id': profile.selected_store.id,
                        'name': profile.selected_store.name,
                        'api_url': profile.selected_store.api_url,
                    }
            except Exception:
                selected_store = None

        # además devolver la lista de tiendas del usuario para el frontend
        stores_list = []
        try:
            stores_qs = Store.objects.filter(owner=user).order_by('-creado_en')
            stores_list = [{'id': s.id, 'name': s.name,
                            'api_url': s.api_url} for s in stores_qs]
        except Exception:
            stores_list = []

        return Response({
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': profile.phone,
            'company': profile.company,
            'address': profile.address,
            'avatar_url': avatar_url,
            'selected_store': selected_store,
            'stores': stores_list,
            'groups': [g.name for g in user.groups.all()],
        })

    def put(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        data = request.data or {}
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.email = data.get('email', user.email)
        profile.phone = data.get('phone', profile.phone)
        profile.company = data.get('company', profile.company)
        profile.address = data.get('address', profile.address)
        # permitir actualizar la tienda seleccionada mediante "selected_store"
        selected_store_id = data.get(
            'selected_store') or data.get('selected_store_id')
        if selected_store_id is not None:
            try:
                store = Store.objects.get(id=selected_store_id, owner=user)
                profile.selected_store = store
            except Store.DoesNotExist:
                profile.selected_store = None
        # permitir cambiar contraseña mediante los campos `password` y `password2`
        password = data.get('password')
        password2 = data.get('password2')
        current_password = data.get('current_password')
        password_errors = None
        if password or password2:
            # exigir la contraseña actual para confirmar identidad
            if not current_password:
                password_errors = 'La contraseña actual es requerida para cambiar la contraseña.'
            elif not user.check_password(current_password):
                password_errors = 'La contraseña actual es incorrecta.'
            elif not password or not password2:
                password_errors = 'Ambos campos de contraseña son requeridos.'
            elif password != password2:
                password_errors = 'Las contraseñas no coinciden.'
            else:
                # validar fuerza de contraseña
                try:
                    validate_password(password, user=user)
                except Exception as e:
                    try:
                        password_errors = list(e.messages)
                    except Exception:
                        password_errors = str(e)
                if not password_errors:
                    user.set_password(password)
        # si hubo errores de contraseña, no guardar y devolver 400
        if password_errors:
            return Response({'password': password_errors}, status=status.HTTP_400_BAD_REQUEST)

        user.save()
        profile.save()
        avatar_url = f"{settings.MEDIA_URL}{profile.avatar_path}" if profile.avatar_path else None
        return Response({'ok': True, 'avatar_url': avatar_url})


class ProfileAvatarUploadView(APIView):
    """Sube el avatar del usuario y actualiza el perfil."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        file = request.FILES.get('avatar')
        if not file:
            return Response({'detail': 'Archivo "avatar" no recibido'}, status=status.HTTP_400_BAD_REQUEST)
        # asegurar carpeta avatars dentro de MEDIA_ROOT
        try:
            (settings.MEDIA_ROOT / 'avatars').mkdir(parents=True, exist_ok=True)
        except Exception:
            pass
        fs = FileSystemStorage(location=str(settings.MEDIA_ROOT / 'avatars'))
        import os as _os
        _name, ext = _os.path.splitext(file.name)
        filename = f"user_{user.id}{ext or '.jpg'}"
        saved_name = fs.save(filename, file)
        rel_path = f"avatars/{saved_name}"
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.avatar_path = rel_path
        profile.save(update_fields=['avatar_path'])
        return Response({'avatar_url': f"{settings.MEDIA_URL}{rel_path}"})
