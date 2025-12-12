from rest_framework import viewsets
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from .models import Clientes, Productos, Ventas, ModeloPrediccion, EntradaPrediccion, RecomendacionIA, VentaItem, Tasa
from .serializer import (
    Clientes_Serializers,
    Productos_Serializers,
    Ventas_Serializers,
    VentaItem_Serializers,
    ModeloPrediccion_Serializers,
    EntradaPrediccion_Serializers,
    RecomendacionIA_Serializers,
    Tasa_Serializers,
    UserRegistrationSerializer,
)
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Max, Q
from django.db.models import F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from django.views import View
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string
import io, csv, datetime

MONTH_LABELS_ES = ["Ene", "Feb", "Mar", "Abr", "May",
                   "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


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


class Ventas_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo de Ventas"""
    queryset = Ventas.objects.all()
    serializer_class = Ventas_Serializers

    def get_queryset(self):
        # Evitar N+1: traer cliente y items + producto de cada item
        return Ventas.objects.select_related('cliente').prefetch_related('items__producto').order_by('-fecha')


class ModeloPrediccion_ViewSet(viewsets.ModelViewSet):
    """ViewSet para metadatos de modelos de predicción."""
    queryset = ModeloPrediccion.objects.all()
    serializer_class = ModeloPrediccion_Serializers


class EntradaPrediccion_ViewSet(viewsets.ModelViewSet):
    """ViewSet para entradas/resultados de predicción."""
    queryset = EntradaPrediccion.objects.all()
    serializer_class = EntradaPrediccion_Serializers


class RecomendacionIA_ViewSet(viewsets.ModelViewSet):
    queryset = RecomendacionIA.objects.all()
    serializer_class = RecomendacionIA_Serializers


class VentaItem_ViewSet(viewsets.ModelViewSet):
    queryset = VentaItem.objects.all()
    serializer_class = VentaItem_Serializers


class RegisterView(generics.CreateAPIView):
    """Endpoint para registrar un nuevo usuario."""
    queryset = get_user_model().objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer


class Tasa_ViewSet(viewsets.ViewSet):
    """Endpoint liviano para obtener/crear la tasa del día.

    Comportamiento GET (list):
    - Si existe una Tasa con `fecha=today`, devolverla.
    - Si no existe, consultar un proveedor externo (exchangerate.host), guardar
      la tasa USD->VES en la tabla `Tasa` y devolverla.
    """

    def list(self, request):
        from django.utils import timezone
        import urllib.request
        import json

        today = timezone.now().date()
        tasa_obj = Tasa.objects.filter(
            fecha=today).order_by('-creado_en').first()
        if tasa_obj:
            serializer = Tasa_Serializers(tasa_obj)
            return Response(serializer.data)

        # No hay tasa para hoy: intentar obtenerla de exchangerate.host
        try:
            url = 'https://api.exchangerate.host/latest?base=USD&symbols=VES'
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            rate = data.get('rates', {}).get('VES')
            if rate is None:
                raise ValueError('No se obtuvo tasa VES en la respuesta')

            # Guardar en la BD
            tasa_obj = Tasa.objects.create(fecha=today, tasa=rate)
            serializer = Tasa_Serializers(tasa_obj)
            return Response(serializer.data)
        except Exception as e:
            # En caso de falla, intentar devolver la última tasa guardada
            last = Tasa.objects.order_by('-fecha').first()
            if last:
                serializer = Tasa_Serializers(last)
                return Response(serializer.data)
            # Si no hay nada, devolver error 503
            return Response({'detail': 'No se pudo obtener la tasa'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class SalesMonthlyView(APIView):
    """Devuelve ventas totales por mes (últimos N meses).

    Response: [{ month: 'Ene', sales: 12345.67 }, ...]
    """

    def get(self, request):
        # parámetro opcional months (int)
        months = int(request.query_params.get('months', 12))
        today = timezone.now().date()
        # construir lista de meses (year, month) descendente desde current
        months_list = []
        year = today.year
        month = today.month
        for i in range(months - 1, -1, -1):
            # retroceder i meses
            m = month - i
            y = year
            while m <= 0:
                m += 12
                y -= 1
            months_list.append((y, m))

        # Agregamos por mes usando TruncMonth
        # Ventas (cabeceras) agregadas por mes
        ventas_qs = Ventas.objects.filter(estado=Ventas.ESTADO_COMPLETADA)
        ventas_agg = (
            ventas_qs.annotate(m=TruncMonth('fecha'))
            .values('m')
            .annotate(sales_sum=Sum('precio_total'), sales_count=Count('id'))
            .order_by('m')
        )
        ventas_map = {item['m'].date().replace(day=1): {
            'sales_sum': float(item.get('sales_sum') or 0),
            'sales_count': int(item.get('sales_count') or 0)
        } for item in ventas_agg}

        # Items agregados por mes (más granular) — usamos venta__fecha
        items_qs = VentaItem.objects.select_related(
            'venta').filter(venta__estado=Ventas.ESTADO_COMPLETADA)
        items_agg = (
            items_qs.annotate(m=TruncMonth('venta__fecha'))
            .values('m')
            .annotate(items_revenue=Sum('precio_total'), items_count=Count('id'))
            .order_by('m')
        )
        items_map = {item['m'].date().replace(day=1): {
            'items_revenue': float(item.get('items_revenue') or 0),
            'items_count': int(item.get('items_count') or 0)
        } for item in items_agg}

        data = []
        for y, m in months_list:
            key = timezone.datetime(year=y, month=m, day=1).date()
            label = MONTH_LABELS_ES[m - 1]
            v = ventas_map.get(key, {'sales_sum': 0.0, 'sales_count': 0})
            it = items_map.get(key, {'items_revenue': 0.0, 'items_count': 0})
            data.append({
                'month': label,
                'sales_sum': v['sales_sum'],
                'sales_count': v['sales_count'],
                'items_revenue': it['items_revenue'],
                'items_count': it['items_count'],
            })

        return Response(data)


class RevenueByCategoryView(APIView):
    """Devuelve ingresos y un costo estimado por categoría.

    Response: [{ category: 'Electrónica', revenue: 12345.67, cost: 8000 }, ...]
    Nota: el modelo no contiene un campo 'cost' por producto; se estima aquí como
    un porcentaje del ingreso (asumimos 60% como costo). Si hay una fuente
    real de costo, reemplazar la estimación.
    """

    def get(self, request):
        # se puede filtrar por periodo, pero por defecto usamos todas las ventas completadas
        qs = VentaItem.objects.select_related('producto', 'venta').filter(
            venta__estado=Ventas.ESTADO_COMPLETADA)
        agg = (
            qs.values(cat=F('producto__categoria'))
            .annotate(revenue=Sum('precio_total'))
            .order_by('-revenue')
        )
        data = []
        COST_RATIO = 0.6  # suposición: 60% del ingreso es costo
        for item in agg:
            revenue = float(item['revenue'] or 0)
            cost = revenue * COST_RATIO
            data.append(
                {'category': item['cat'] or 'Sin categoría', 'revenue': revenue, 'cost': cost})
        return Response(data)


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

        top_qs = (
            Ventas.objects.filter(estado=Ventas.ESTADO_COMPLETADA)
            .values(cliente_pk=F('cliente__id'), cliente_name=F('cliente__nombre'))
            .annotate(total_spent=Sum('precio_total'))
            .order_by('-total_spent')
        )
        top_list = list(top_qs[:limit])
        top_ids = [item['cliente_pk'] for item in top_list]

        monthly_qs = (
            Ventas.objects.filter(
                estado=Ventas.ESTADO_COMPLETADA, cliente__id__in=top_ids)
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

        return Response({'months': months_labels, 'series': series})


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
        params = getattr(request, 'GET', None) or getattr(request, 'query_params', None) or {}
        # Accept multiple possible parameter names and provide a sensible default
        raw = (params.get('count') or params.get('limit') or params.get('n') or '').strip()

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
        params = getattr(request, 'GET', None) or getattr(request, 'query_params', None) or {}
        raw = (params.get('count') or params.get('limit') or params.get('n') or '').strip()

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
        params = getattr(request, 'GET', None) or getattr(request, 'query_params', None) or {}
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
            params = getattr(request, 'GET', None) or getattr(request, 'query_params', None) or {}
            from django.utils.dateparse import parse_datetime, parse_date
            df = params.get('date_from')
            dt = params.get('date_to')
            if not df or not dt:
                return JsonResponse({'detail': 'date_from and date_to are required for ventas'}, status=status.HTTP_400_BAD_REQUEST)

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
            qs = Ventas.objects.select_related('cliente').prefetch_related('items__producto').filter(fecha__gte=start, fecha__lte=end).order_by('-fecha')
            fields = ['id', 'fecha', 'cliente_id', 'cliente_nombre', 'precio_total', 'metodo_compra', 'estado', 'items_count']
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
            for fname in fields:
                # support computed ventas fields
                if entity_label == 'ventas':
                    if fname == 'cliente_id':
                        val = getattr(obj, 'cliente_id', '')
                    elif fname == 'cliente_nombre':
                        cli = getattr(obj, 'cliente', None)
                        val = f"{getattr(cli, 'nombre', '')} {getattr(cli, 'apellido', '')}" if cli else ''
                    elif fname == 'items_count':
                        try:
                            val = obj.items.count()
                        except Exception:
                            val = ''
                    else:
                        val = getattr(obj, fname, '')
                else:
                    val = getattr(obj, fname, '')

                # format datetimes/decimals
                if isinstance(val, (datetime.date, datetime.datetime)):
                    val = val.isoformat()
                row.append(str(val) if val is not None else '')
            writer.writerow(row)

        resp = HttpResponse(buffer.getvalue(), content_type='text/csv')
        now = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        resp['Content-Disposition'] = f'attachment; filename="{entity_label}_{now}.csv"'
        return resp


class ExportPDFView(View, ExportMixin):
    # Django View to avoid DRF content-negotiation rejecting PDF Accept header
    def get(self, request):
        params = getattr(request, 'GET', None) or getattr(request, 'query_params', None) or {}
        tipo = params.get('tipo', 'productos')

        # choose entity
        if tipo == 'productos':
            qs = self.get_products_qs(request)
            context = {'products': qs, 'now': datetime.datetime.utcnow()}
            template_name = 'report_products.html'
            entity_label = 'productos'
        elif tipo == 'clientes':
            qs = self.get_clients_qs(request)
            context = {'clients': qs, 'now': datetime.datetime.utcnow()}
            template_name = 'report_clients.html'
            entity_label = 'clientes'
        
        elif tipo == 'ventas':
            params = getattr(request, 'GET', None) or getattr(request, 'query_params', None) or {}
            from django.utils.dateparse import parse_datetime, parse_date
            df = params.get('date_from')
            dt = params.get('date_to')
            if not df or not dt:
                return JsonResponse({'detail': 'date_from and date_to are required for ventas'}, status=status.HTTP_400_BAD_REQUEST)

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
            qs = Ventas.objects.select_related('cliente').prefetch_related('items__producto').filter(fecha__gte=start, fecha__lte=end).order_by('-fecha')
            context = {'sales': qs, 'now': datetime.datetime.utcnow()}
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
