from rest_framework import viewsets
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from .models import Clientes, Productos, Ventas, RecomendacionIA, VentaItem, Tasa
from .serializer import (
    Clientes_Serializers,
    Productos_Serializers,
    Ventas_Serializers,
    VentaItem_Serializers,
    RecomendacionIA_Serializers,
    Tasa_Serializers,
    UserRegistrationSerializer,
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
from .services.gemini_client import (
    generate_ai_recommendation,
    GeminiError,
    build_structured_output,
)
from django.db.models import DecimalField, ExpressionWrapper

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


class Tasa_ViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Tasa."""
    queryset = Tasa.objects.all().order_by('-fecha')
    serializer_class = Tasa_Serializers


class RecomendacionIA_ViewSet(viewsets.ModelViewSet):
    queryset = RecomendacionIA.objects.all()
    serializer_class = RecomendacionIA_Serializers

    def create(self, request, *args, **kwargs):
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
        data = request.data or {}
        returning_prev = returning_prev_qs.count()
        rate_prev = 0.0
        total_prev = buyers_prev_qs.count()
        if total_prev > 0:
            rate_prev = round((returning_prev / total_prev) * 100, 2)

        projected_rate = rate + (rate - rate_prev)
        projected_rate = max(0.0, min(100.0, projected_rate))

        return Response({
            'rate': rate,
            'total_buyers': total_buyers,
            'returning_buyers': returning_buyers,
            'rate_prev': rate_prev,
            'projected_rate': projected_rate,
            'days': days,
        })


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
        product_names = {it['producto__id']                         : it['producto__nombre'] for it in items_now}
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

        try:
            days = int(request.query_params.get('days', 30))
        except Exception:
            days = 30

        now = timezone.now()
        start = now - timedelta(days=days)

        qs = (
            VentaItem.objects.select_related('venta', 'producto')
            .filter(venta__estado=Ventas.ESTADO_COMPLETADA, venta__fecha__gte=start, venta__fecha__lte=now)
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
            qs = Ventas.objects.select_related('cliente').prefetch_related(
                'items__producto').filter(fecha__gte=start, fecha__lte=end).order_by('-fecha')
            fields = ['id', 'fecha', 'cliente_id', 'cliente_nombre',
                      'precio_total', 'metodo_compra', 'estado', 'items_count']
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
        params = getattr(request, 'GET', None) or getattr(
            request, 'query_params', None) or {}
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
            params = getattr(request, 'GET', None) or getattr(
                request, 'query_params', None) or {}
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
            qs = Ventas.objects.select_related('cliente').prefetch_related(
                'items__producto').filter(fecha__gte=start, fecha__lte=end).order_by('-fecha')
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
            data.append({
                'month': label,
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
