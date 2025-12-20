import os
from datetime import timedelta
from typing import Iterable, List, Optional, Tuple, Dict

import google.generativeai as genai
import json
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, F

from ..models import Productos, Ventas, VentaItem


class GeminiError(Exception):
    """Errores controlados al generar recomendaciones con Gemini."""


def _configure_model() -> genai.GenerativeModel:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise GeminiError("Falta la variable de entorno GEMINI_API_KEY")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash-lite",
        generation_config={
            "temperature": 0.25,
            "max_output_tokens": 180,  # Respuesta muy breve
            "top_p": 0.9,
            "response_mime_type": "application/json",
        },
    )


def _collect_product_context(
    product_ids: Optional[Iterable[int]] = None,
    category: Optional[str] = None,
    limit: int = 3,
) -> List[dict]:
    """Obtiene un snapshot numérico de productos para alimentar el prompt."""

    base_qs = Productos.objects.all()
    if product_ids:
        base_qs = base_qs.filter(id__in=product_ids)
    if category:
        base_qs = base_qs.filter(categoria__iexact=category)

    # Orden determinista pero con prioridad a filtros:
    # 1) si hay product_ids, respetar ese orden de entrada
    # 2) si no, ordenar por vendidos desc
    if product_ids:
        id_list = [int(pid) for pid in product_ids]
        product_map = {p.id: p for p in base_qs}
        products = [product_map[pid] for pid in id_list if pid in product_map]
    else:
        products = list(base_qs.order_by("-vendidos")[:limit])
    if not products:
        return []

    now = timezone.now()
    last_30 = now - timedelta(days=30)
    prev_30 = now - timedelta(days=60)

    # Ventas recientes (últimos 30) y previas (30-60) para cambio de demanda.
    recent_qs = (
        VentaItem.objects.select_related("venta")
        .filter(venta__estado=Ventas.ESTADO_COMPLETADA, venta__fecha__gte=last_30)
        .values("producto_id")
        .annotate(units=Sum("cantidad"), revenue=Sum("precio_total"))
    )
    prev_qs = (
        VentaItem.objects.select_related("venta")
        .filter(
            venta__estado=Ventas.ESTADO_COMPLETADA,
            venta__fecha__gte=prev_30,
            venta__fecha__lt=last_30,
        )
        .values("producto_id")
        .annotate(units=Sum("cantidad"), revenue=Sum("precio_total"))
    )

    recent_map = {r["producto_id"]: r for r in recent_qs}
    prev_map = {r["producto_id"]: r for r in prev_qs}

    ctx = []
    for p in products:
        rec = recent_map.get(p.id, {})
        prev = prev_map.get(p.id, {})
        units_recent = int(rec.get("units") or 0)
        revenue_recent = float(rec.get("revenue") or 0)
        units_prev = int(prev.get("units") or 0)
        revenue_prev = float(prev.get("revenue") or 0)

        stock_val = int(p.stock or 0)
        # Costos y márgenes
        try:
            costo_val = float(p.costo) if getattr(
                p, 'costo', None) is not None else None
        except Exception:
            costo_val = None
        precio_val = float(p.precio or 0)
        margen_unit = (
            precio_val - costo_val) if (costo_val is not None) else None
        margen_pct = ((margen_unit / precio_val) *
                      100.0) if (margen_unit is not None and precio_val > 0) else None

        # Variación: si no hay histórico previo, la marcamos en 0 para evitar saltos enormes
        change_pct_units = 0.0
        if units_prev > 0:
            change_pct_units = (
                (units_recent - units_prev) / units_prev) * 100.0

        weekly_avg_recent = units_recent / 4.0 if units_recent else 0.0
        weekly_avg_prev = units_prev / 4.0 if units_prev else 0.0

        # Cobertura en semanas: si no hay ventas recientes, dejar como None (no definido)
        cover_weeks = (
            stock_val / weekly_avg_recent) if weekly_avg_recent > 0 else None
        # Beneficios estimados (30d) usando margen unitario
        profit_30d = (
            units_recent * margen_unit) if (margen_unit is not None) else 0.0
        profit_prev_30d = (
            units_prev * margen_unit) if (margen_unit is not None) else 0.0
        inv_valorado = (
            stock_val * costo_val) if (costo_val is not None) else None
        ctx.append(
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "precio": float(p.precio or 0),
                "costo": costo_val,
                "margen_unit": margen_unit,
                "margen_pct": margen_pct,
                "stock": stock_val,
                "tendencia": p.tendencias,
                "estado": p.estado,
                "ventas_30d": units_recent,
                "revenue_30d": revenue_recent,
                "ventas_prev_30d": units_prev,
                "revenue_prev_30d": revenue_prev,
                "variacion_unidades_pct": change_pct_units,
                "venta_prom_semanal": weekly_avg_recent,
                "venta_prom_prev_semanal": weekly_avg_prev,
                "stock_cover_weeks": cover_weeks,
                # Relación stock vs unidades previas: None si no hay histórico previo
                "stock_vs_prev_units": (stock_val / units_prev) if units_prev > 0 else None,
                "beneficio_30d": profit_30d,
                "beneficio_prev_30d": profit_prev_30d,
                "inventario_valorado": inv_valorado,
            }
        )

    return ctx


def _build_prompt(products_ctx: List[dict]) -> str:
    bullets = []
    for p in products_ctx:
        bullets.append(
            (
                f"Producto: {p['nombre']} (cat: {p['categoria']}), precio {p['precio']:.2f}, costo {(p.get('costo') if p.get('costo') is not None else 'N/A')}, "
                f"margen_unit {(p.get('margen_unit') if p.get('margen_unit') is not None else 'N/A')}, margen_pct {(p.get('margen_pct') if p.get('margen_pct') is not None else 'N/A')}, "
                f"stock {p['stock']}, tendencia {p['tendencia']}, estado {p['estado']}; "
                f"ventas 30d: {p['ventas_30d']} uds (${p['revenue_30d']:.2f}), "
                f"previas 30d: {p['ventas_prev_30d']} uds (${p['revenue_prev_30d']:.2f}), "
                f"variación unidades: {p['variacion_unidades_pct']:.1f}%, "
                f"prom semanal reciente: {p['venta_prom_semanal']:.2f} uds, beneficio_30d {(p.get('beneficio_30d') or 0):.2f}"
            )
        )

    products_block = "\n".join(f"- {b}" for b in bullets)

    prompt = f"""
Eres analista de growth/marketing para un e-commerce. Usa SOLO los datos numéricos entregados.
Redacta la recomendación ya calculada (acción, cambio_pct, impacto) en español claro.
El impacto debe referirse a beneficio (ganancia) estimada, no solo a ingresos.
Contexto de productos (no inventes datos distintos):
{products_block}

Devuelve SOLO un JSON (sin backticks) con este esquema exacto:
{{
    "title": string,
    "type": "pricing_increase" | "pricing_decrease" | "promo_campaign" | "bundle" | "discount",
    "change_pct": number | null,
    "description": string,
    "impact": string
}}
"""
    return prompt.strip()


def _compute_priorities(products_ctx: List[dict]) -> Tuple[str, str]:
    """Deriva prioridades en base a variación y cobertura de stock."""

    marketing_priority = "baja"
    stock_priority = "baja"

    # Marketing: combina variación vs beneficio para priorizar acciones con impacto real
    max_score = 0.0
    for p in products_ctx:
        try:
            var = abs(float(p.get("variacion_unidades_pct") or 0))
            benefit = float(p.get("beneficio_30d") or 0)
            score = var * 0.7 + (benefit / 100.0) * 0.3
            max_score = max(max_score, score)
        except Exception:
            continue
    if max_score >= 20:
        marketing_priority = "alta"
    elif max_score >= 8:
        marketing_priority = "media"

    # Stock: cobertura de semanas y valor de inventario atado (stock * costo)
    min_cover = None
    max_inv_risk = 0.0
    for p in products_ctx:
        weekly = float(p.get("venta_prom_semanal") or 0)
        stock = float(p.get("stock") or 0)
        cover = stock / weekly if weekly > 0 else float("inf")
        inv_val = float(p.get("inventario_valorado") or 0)
        if min_cover is None or cover < min_cover:
            min_cover = cover
        max_inv_risk = max(max_inv_risk, inv_val)

    if min_cover is not None:
        if min_cover < 2:
            stock_priority = "alta"
        elif min_cover < 4 or max_inv_risk > 0:
            stock_priority = "media"

    return marketing_priority, stock_priority


def _evaluate_options(products_ctx: List[dict]) -> Tuple[dict, List[dict]]:
    """Genera varias opciones deterministas y retorna la mejor y el listado completo."""

    # Elegir producto clave: prioriza beneficio y riesgo de inventario
    if len(products_ctx) == 1:
        key = products_ctx[0]
    else:
        scored = []
        for p in products_ctx:
            benefit = float(p.get("beneficio_30d") or 0)
            inv_risk = float(p.get("inventario_valorado") or 0)
            var = abs(float(p.get("variacion_unidades_pct") or 0))
            score = benefit * 0.6 + inv_risk * 0.3 + var * 0.1
            scored.append((score, p))
        scored.sort(key=lambda t: t[0], reverse=True)
        # rotación suave por minuto entre los top 3 para evitar repetición
        top = scored[:max(1, min(3, len(scored)))]
        now_ts = timezone.now()
        # Rotación a nivel de segundos/microsegundos para evitar repetir dentro del mismo minuto
        idx = ((now_ts.minute * 60) + now_ts.second +
               (now_ts.microsecond // 1000)) % len(top)
        key = top[idx][1]

    vari = float(key.get("variacion_unidades_pct") or 0)
    cover = float(key.get("stock_cover_weeks") or float("inf"))
    revenue_30d = float(key.get("revenue_30d") or 0)
    margen_pct = key.get("margen_pct")
    margen_unit = key.get("margen_unit")
    costo_val = key.get("costo")
    beneficio_30d = float(key.get("beneficio_30d") or 0)

    options: List[Dict[str, object]] = []

    def add_option(rtype: str, change: Optional[int], title: str, rationale: str):
        # Limitar cobertura para evitar números muy grandes; caso especial sin ventas
        if cover == float("inf"):
            cover_text = "sin ventas recientes"
        else:
            cover_cap = min(cover, 12.0)
            cover_text = f"{cover_cap:.1f} semanas" if cover_cap < 12 else "12 o más semanas"

        # Impacto estimado basado en beneficio (ganancia), no solo ingresos
        impact_val = beneficio_30d * \
            (change / 100.0) if (beneficio_30d > 0 and change) else 0.0
        impact = f"+$${impact_val:,.0f} beneficio mensual estimado" if impact_val > 0 else ""

        # Construir acción clara y sin abreviaciones
        if rtype == "discount":
            action = f"Acción: aplicar un descuento del {change}% de forma inmediata en la página del producto y en el carrito, destacándolo en el banner y en los listados."
        elif rtype == "pricing_increase":
            action = f"Acción: aumentar el precio en {change}% y monitorizar la conversión durante 48 horas." if change else "Acción: aumentar el precio y monitorizar la conversión durante 48 horas."
        elif rtype == "bundle":
            action = "Acción: crear un paquete con el producto focal y un accesorio complementario y destacarlo en la página del producto y en el carrito."
        else:  # promo_campaign
            action = "Acción: lanzar una campaña promocional dirigida a las personas que visitaron la página del producto en los últimos 14 días, con una llamada a la acción para comprar."

        desc = f"{action} Motivo: {rationale}. Señal: variación {vari:+.1f}%, cobertura {cover_text}."
        options.append({
            "title": title,
            "type": rtype,
            "change_pct": change,
            "description": desc,
            "impact": impact,
            "product_focus": key,
            "impact_val": impact_val,
        })

    # Opciones deterministas (cost-aware)
    # 1) Subida de precio si hay demanda y margen admite mejora
    if vari >= 8 and (margen_pct is not None and margen_pct <= 50) and cover >= 2:
        add_option("pricing_increase", 6, "Ajuste de precio basado en margen",
                   "Demanda al alza y margen mejorable; aumento controlado para elevar el beneficio")
    # 2) Descuento solo si margen permite absorberlo o hay sobrestock
    if (margen_pct is not None and margen_pct >= 30 and (vari <= -8 or cover >= 8)) or (cover >= 10):
        rationale = "Sobrestock o demanda en caída; el margen permite aplicar un descuento sin perder demasiado beneficio"
        add_option("discount", 10, "Descuento táctico con margen", rationale)
    # 3) Bundle para elevar ticket cuando margen es bajo o stock es bajo
    if (margen_pct is not None and margen_pct < 25) or cover < 2:
        add_option("bundle", None, "Paquete de productos para aumentar el margen",
                   "Aumentar el valor medio del pedido y mejorar el margen unitario")
    # 4) Campaña siempre disponible
    add_option("promo_campaign", None, "Campaña promocional de reimpacto",
               "Volver a impactar a visitantes recientes de la página del producto con una oferta basada en valor")
    # Variantes adicionales para dinamismo (reutilizan los mismos tipos permitidos)
    if cover >= 10:
        add_option("discount", 12, "Venta relámpago de 48 horas para liquidar stock",
                   "Stock muy alto; venta relámpago de 48 horas para liberar inventario manteniendo el margen")

    if vari <= -5 and cover >= 4:
        add_option("promo_campaign", None, "Reimpacto a visitantes de la página del producto (14 días)",
                   "Tráfico previo sin conversión; volver a impactar a visitantes recientes con una llamada a la acción para comprar")

    if vari >= 6 and cover >= 3 and cover <= 7:
        add_option("bundle", None, "Venta cruzada en página del producto y carrito",
                   "Demanda moderada; aumentar el valor medio del pedido con un accesorio complementario")

    if revenue_30d > 0 and cover >= 6:
        add_option("promo_campaign", None, "Envío gratis condicionado",
                   "Stock alto; impulsar la conversión ofreciendo envío gratis por encima de un pedido mínimo")

    if revenue_30d == 0 and cover != float("inf"):
        add_option("pricing_decrease", 5, "Reducción de precio para activar ventas",
                   "Producto sin ventas recientes; prueba con reducción de precio para activar la demanda")

    # Elegir mejor por impacto estimado; desempate por prioridad de tipo.
    # Para evitar que siempre devuelva el mismo mensaje en cada clic, rotamos la selección
    # entre las opciones disponibles usando la marca de tiempo (segundos) como offset.
    priority_order = {"pricing_increase": 4,
                      "discount": 3, "bundle": 2, "promo_campaign": 1, "pricing_decrease": 2}
    scored_opts: List[tuple[float, dict]] = []
    for opt in options:
        score = float(opt.get("impact_val") or 0)
        score += priority_order.get(opt.get("type"), 0) * 0.01
        scored_opts.append((score, opt))

    # Ordenar por score y luego elegir entre top 3 con rotación por minuto (para variedad)
    scored_opts.sort(key=lambda t: t[0], reverse=True)
    if not scored_opts:
        return options[0], options

    top_opts = scored_opts[:max(1, min(3, len(scored_opts)))]
    now_ts2 = timezone.now()
    choice_idx = (now_ts2.second + (now_ts2.microsecond // 1000)
                  ) % len(top_opts)
    best_opt = top_opts[choice_idx][1]

    return best_opt, options


def generate_ai_recommendation(
    product_ids: Optional[Iterable[int]] = None,
    category: Optional[str] = None,
    limit: int = 3,
) -> dict:
    products_ctx = _collect_product_context(
        product_ids=product_ids, category=category, limit=limit)
    if not products_ctx:
        raise GeminiError(
            "No se encontraron productos para generar la recomendación")

    # Generar opciones deterministas y usar Gemini solo para redactar
    best_card, options = _evaluate_options(products_ctx)
    model = _configure_model()
    prompt = _build_prompt(products_ctx)

    def _extract_first_json_block(txt: str) -> str | None:
        if not txt:
            return None
        # Busca el primer bloque JSON equilibrado con llaves
        start = None
        depth = 0
        for i, ch in enumerate(txt):
            if ch == '{':
                if start is None:
                    start = i
                depth += 1
            elif ch == '}':
                if start is not None:
                    depth -= 1
                    if depth == 0:
                        return txt[start:i+1]
        return None

    try:
        result = model.generate_content(prompt)
        text = (result.text or "").strip()
    except Exception as exc:  # noqa: BLE001
        raise GeminiError(f"Error al invocar Gemini: {exc}")

    if not text:
        raise GeminiError("Gemini no devolvió texto")

    # Parsear JSON generado, con rescate si trae texto adicional
    data = None
    try:
        data = json.loads(text)
    except Exception:
        try:
            block = _extract_first_json_block(text)
            if block:
                data = json.loads(block)
        except Exception:
            data = None

    # Usar siempre los campos deterministas para evitar inconsistencias del modelo
    if data is None or not isinstance(data, dict):
        data = best_card
    else:
        data["change_pct"] = best_card.get("change_pct")
        data["type"] = best_card.get("type")
        data["title"] = best_card.get("title")
        data["impact"] = best_card.get("impact")
        data["description"] = best_card.get("description")

    # Derivar prioridad en base a tipo y contexto
    reco_type = (data.get("type") or "").strip()
    marketing_priority, stock_priority = _compute_priorities(products_ctx)

    def _derive_priority(rt: str) -> str:
        # Basado en variación y cobertura calculadas anteriormente
        if rt in {"pricing_increase", "pricing_decrease"}:
            return marketing_priority
        if rt in {"promo_campaign", "discount", "bundle"}:
            # promo si la variación es moderada
            return "media" if marketing_priority == "alta" else marketing_priority
        return marketing_priority

    # Derivar prioridad analítica combinando marketing y stock
    derived_priority = _derive_priority(reco_type)
    prio_rank = {"baja": 0, "media": 1, "alta": 2}
    best_context_priority = derived_priority
    try:
        # elegir la más alta entre marketing y stock
        best_context_priority = max(
            [derived_priority, stock_priority], key=lambda p: prio_rank.get(
                p, 0)
        )
    except Exception:
        best_context_priority = derived_priority or marketing_priority
    priority = best_context_priority

    # Formatear summary en 4 líneas: título, prioridad capitalizada, descripción, línea en blanco y luego impacto
    pr_cap = priority.capitalize()
    description = (data.get("description") or "").strip()
    impact = (data.get("impact") or "").strip()
    title = (data.get("title") or "Recomendación").strip()
    # Product focus id for persistence
    product_focus = best_card.get(
        "product_focus") if 'best_card' in locals() else None
    product_id = None
    product_name = ""
    try:
        product_id = int(product_focus.get('id')) if product_focus and product_focus.get(
            'id') is not None else None
        product_name = str(product_focus.get('nombre')
                           or "") if product_focus else ""
    except Exception:
        product_id = None
        product_name = ""

    product_label = f"Producto: {product_name} (ID {product_id})" if product_name or product_id else "Producto no identificado"

    lines = [f"{title} · {product_label}", pr_cap, description]
    if impact:
        lines.append("")
        lines.append(impact)
    summary = "\n".join(lines)

    return {
        "summary": summary,
        "card": {
            "title": title,
            "priority": priority,
            "type": reco_type,
            "description": description,
            "impact": impact,
            "change_pct": data.get("change_pct"),
            "product_id": product_id,
            "product_name": product_name,
            "product_label": product_label,
        },
        "products": products_ctx,
        "debug": {
            "best_option": best_card,
            "options": options,
            "metrics": products_ctx,
        },
    }
