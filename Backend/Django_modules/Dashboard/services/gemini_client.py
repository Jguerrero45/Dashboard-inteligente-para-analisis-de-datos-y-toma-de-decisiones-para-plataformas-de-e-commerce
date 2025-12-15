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

        # Variación: si no hay histórico previo, la marcamos en 0 para evitar saltos enormes
        change_pct_units = 0.0
        if units_prev > 0:
            change_pct_units = (
                (units_recent - units_prev) / units_prev) * 100.0

        weekly_avg_recent = units_recent / 4.0 if units_recent else 0.0
        weekly_avg_prev = units_prev / 4.0 if units_prev else 0.0

        cover_weeks = (
            stock_val / weekly_avg_recent) if weekly_avg_recent > 0 else float("inf")
        ctx.append(
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "precio": float(p.precio or 0),
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
                "stock_vs_prev_units": (stock_val / units_prev) if units_prev > 0 else float("inf"),
            }
        )

    return ctx


def _build_prompt(products_ctx: List[dict]) -> str:
    bullets = []
    for p in products_ctx:
        bullets.append(
            (
                f"Producto: {p['nombre']} (cat: {p['categoria']}), precio {p['precio']:.2f}, "
                f"stock {p['stock']}, tendencia {p['tendencia']}, estado {p['estado']}; "
                f"ventas 30d: {p['ventas_30d']} uds (${p['revenue_30d']:.2f}), "
                f"previas 30d: {p['ventas_prev_30d']} uds (${p['revenue_prev_30d']:.2f}), "
                f"variación unidades: {p['variacion_unidades_pct']:.1f}%, "
                f"prom semanal reciente: {p['venta_prom_semanal']:.2f} uds"
            )
        )

    products_block = "\n".join(f"- {b}" for b in bullets)

    prompt = f"""
Eres analista de growth/marketing para un e-commerce. Usa SOLO los datos numéricos entregados.
Redacta la recomendación ya calculada (acción, cambio_pct, impacto) en español claro.
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

    # Marketing: usa la mayor variación absoluta de unidades
    max_var = 0.0
    for p in products_ctx:
        try:
            max_var = max(max_var, abs(
                float(p.get("variacion_unidades_pct") or 0)))
        except Exception:
            continue
    if max_var >= 15:
        marketing_priority = "alta"
    elif max_var >= 7:
        marketing_priority = "media"

    # Stock: cobertura de semanas (stock / venta_prom_semanal)
    min_cover = None
    for p in products_ctx:
        weekly = float(p.get("venta_prom_semanal") or 0)
        stock = float(p.get("stock") or 0)
        cover = stock / weekly if weekly > 0 else float("inf")
        if min_cover is None or cover < min_cover:
            min_cover = cover

    if min_cover is not None:
        if min_cover < 2:
            stock_priority = "alta"
        elif min_cover < 4:
            stock_priority = "media"

    return marketing_priority, stock_priority


def _evaluate_options(products_ctx: List[dict]) -> Tuple[dict, List[dict]]:
    """Genera varias opciones deterministas y retorna la mejor y el listado completo."""

    # Elegir producto clave: si vienen filtros (un solo producto), úsalo sin rotar.
    # Si hay varios productos, mantener rotación por día solo cuando no se pasó product_ids.
    if len(products_ctx) == 1:
        key = products_ctx[0]
    else:
        scored = []
        for p in products_ctx:
            score = float(p.get("ventas_30d") or 0) + \
                abs(float(p.get("variacion_unidades_pct") or 0)) * 0.3
            scored.append((score, p))
        scored.sort(key=lambda t: t[0], reverse=True)
        day_idx = timezone.now().timetuple().tm_yday % len(scored)
        key = scored[day_idx][1]

    vari = float(key.get("variacion_unidades_pct") or 0)
    cover = float(key.get("stock_cover_weeks") or float("inf"))
    revenue_30d = float(key.get("revenue_30d") or 0)

    options: List[Dict[str, object]] = []

    def add_option(rtype: str, change: Optional[int], title: str, rationale: str):
        # Cap coverage to avoid unreadable huge numbers; special-case no sales
        if cover == float("inf"):
            cover_text = "sin ventas recientes"
        else:
            cover_cap = min(cover, 12.0)
            cover_text = f"{cover_cap:.1f} sem" if cover_cap < 12 else "≥12 sem"

        impact_val = revenue_30d * \
            (change / 100.0) if revenue_30d > 0 and change else 0.0
        impact = f"+${impact_val:,.0f} mensuales estimados" if impact_val > 0 else ""

        # Construir orden breve y accionable
        if rtype == "discount":
            action = f"Acción: aplicar {change}% de descuento inmediato en PDP/carrito y empujar en banner/listados."
        elif rtype == "pricing_increase":
            action = f"Acción: subir precio en {change}% y monitorear conversión 48h." if change else "Acción: subir precio y monitorear conversión 48h."
        elif rtype == "bundle":
            action = "Acción: crear bundle con producto foco + accesorio y destacar en PDP/carrito."
        else:  # promo_campaign
            action = "Acción: lanzar campaña promocional al público que visitó PDP en 14 días con CTA de compra."

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

    # Opciones deterministas
    if vari >= 12 and cover >= 2:
        add_option("pricing_increase", 8, "Ajuste de Precio Recomendado",
                   "Demanda en alza; margen admite subida controlada")
    if vari <= -12 or cover >= 8:
        # Razonamiento específico según condición dominante
        if vari <= -12 and cover >= 8:
            rationale = "Demanda en caída y stock alto; rotar inventario con descuento"
        elif vari <= -12:
            rationale = "Demanda en caída; incentivo de precio para recuperar volumen"
        else:
            rationale = "Stock alto; activar descuento para acelerar rotación"
        add_option("discount", 12,
                   "Descuento Promocional Recomendado", rationale)
    if cover < 2:
        add_option("bundle", None, "Bundle/Combo para Maximizar Ticket",
                   "Stock bajo; maximizar ticket y proteger disponibilidad")
    # Opción base
    add_option("promo_campaign", None, "Campaña Promocional Recomendada",
               "Campaña segmentada para impulsar conversión y upsell")
    # Variantes adicionales para dinamismo (reutilizan los mismos tipos permitidos)
    if cover >= 10:
        add_option("discount", 15, "Flash Sale 48h para Liquidar Stock",
                   "Stock muy alto; venta flash 48h para liberar inventario")

    if vari <= -5 and cover >= 4:
        add_option("promo_campaign", None, "Remarketing a Visitantes PDP (14d)",
                   "Tráfico previo sin conversión; reimpactar a visitantes recientes con CTA de compra")

    if vari >= 6 and cover >= 3 and cover <= 7:
        add_option("bundle", None, "Cross-sell en PDP/Carrito",
                   "Demanda moderada; elevar ticket medio con accesorio complementario")

    if revenue_30d > 0 and cover >= 6:
        add_option("promo_campaign", None, "Envío Gratis Condicionado",
                   "Stock alto; empujar conversión con envío gratis sobre ticket mínimo")

    if revenue_30d == 0 and cover != float("inf"):
        add_option("pricing_decrease", 5, "Rebaja Controlada para Activar Ventas",
                   "Producto sin ventas recientes; prueba de precio para activar demanda")

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

    # Ordenar por score y luego rotar por segundo actual
    scored_opts.sort(key=lambda t: t[0], reverse=True)
    if not scored_opts:
        return options[0], options

    now_sec = timezone.now().second
    choice_idx = now_sec % len(scored_opts)
    best_opt = scored_opts[choice_idx][1]

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

    # Si sigue sin JSON, usamos la opción determinista elegida
    if data is None or not isinstance(data, dict):
        data = best_card
    else:
        # Reemplazar campos sensibles con los deterministas para asegurar consistencia numérica
        data.setdefault("change_pct", best_card.get("change_pct"))
        data.setdefault("type", best_card.get("type"))
        data.setdefault("title", best_card.get("title"))
        # impact/description pueden venir del modelo; si faltan, usamos determinista
        if not data.get("impact"):
            data["impact"] = best_card.get("impact")
        if not data.get("description"):
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

    priority = _derive_priority(reco_type)

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
