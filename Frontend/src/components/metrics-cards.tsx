"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { useEffect, useMemo, useState } from "react"
import { getApiBase } from "@/lib/activeStore"

export function MetricsCards() {
  const { formatPrice } = useCurrency()
  const API_BASE = getApiBase()

  const [salesMonthly, setSalesMonthly] = useState<any[]>([])
  const [customersMonthly, setCustomersMonthly] = useState<any[]>([])


  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [resSales, resCustomers] = await Promise.all([
          fetch(`${API_BASE}/metrics/sales-monthly/?months=2`),
          fetch(`${API_BASE}/metrics/customers-monthly/?months=2`),
        ])
        if (mounted && resSales.ok) {
          const data = await resSales.json()
          if (Array.isArray(data)) setSalesMonthly(data)
        }
        if (mounted && resCustomers.ok) {
          const data = await resCustomers.json()
          if (Array.isArray(data)) setCustomersMonthly(data)
        }
      } catch (_) {
        // silencioso
      } finally {
        // no-op
      }
    }
    load()
    return () => { mounted = false }
  }, [API_BASE])

  const currentPrev = useMemo(() => {
    const curr = salesMonthly.length > 0 ? salesMonthly[salesMonthly.length - 1] : null
    const prev = salesMonthly.length > 1 ? salesMonthly[salesMonthly.length - 2] : null
    return { curr, prev }
  }, [salesMonthly])

  const currentPrevCustomers = useMemo(() => {
    const curr = customersMonthly.length > 0 ? customersMonthly[customersMonthly.length - 1] : null
    const prev = customersMonthly.length > 1 ? customersMonthly[customersMonthly.length - 2] : null
    return { curr, prev }
  }, [customersMonthly])

  function pctChange(curr: number, prev: number): { text: string; trend: "up" | "down" } {
    if (prev > 0) {
      const delta = ((curr - prev) / prev) * 100
      const text = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`
      return { text, trend: delta >= 0 ? "up" : "down" }
    }
    return { text: "—", trend: curr >= 0 ? "up" : "down" }
  }

  const nf = new Intl.NumberFormat('es-VE')

  const currMonthLabel = currentPrev.curr?.month ?? ""

  const ventasTotales = (() => {
    const curr = currentPrev.curr?.sales_sum ?? 0
    const prev = currentPrev.prev?.sales_sum ?? 0
    const change = pctChange(curr, prev)
    return { title: "Ventas Totales", value: formatPrice(curr), change: change.text, trend: change.trend, icon: DollarSign, monthLabel: currMonthLabel }
  })()

  const pedidos = (() => {
    const curr = currentPrev.curr?.sales_count ?? 0
    const prev = currentPrev.prev?.sales_count ?? 0
    const change = pctChange(curr, prev)
    return { title: "Pedidos", value: nf.format(curr), change: change.text, trend: change.trend, icon: ShoppingCart, monthLabel: currMonthLabel }
  })()

  const clientesActivos = (() => {
    const currN = currentPrevCustomers.curr ? Number(currentPrevCustomers.curr.nuevos || 0) : 0
    const currR = currentPrevCustomers.curr ? Number(currentPrevCustomers.curr.recurrentes || 0) : 0
    const prevN = currentPrevCustomers.prev ? Number(currentPrevCustomers.prev.nuevos || 0) : 0
    const prevR = currentPrevCustomers.prev ? Number(currentPrevCustomers.prev.recurrentes || 0) : 0
    const curr = currN + currR
    const prev = prevN + prevR
    const change = pctChange(curr, prev)
    return { title: "Compradores del mes", value: nf.format(curr), change: change.text, trend: change.trend, icon: Users, monthLabel: currMonthLabel }
  })()

  const productosVendidos = (() => {
    const curr = currentPrev.curr?.items_units ?? 0
    const prev = currentPrev.prev?.items_units ?? 0
    const change = pctChange(curr, prev)
    return { title: "Productos Vendidos", value: nf.format(curr), change: change.text, trend: change.trend, icon: Package, monthLabel: currMonthLabel }
  })()

  const metrics = [ventasTotales, pedidos, clientesActivos, productosVendidos]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs text-muted-foreground">Este mes{metric.monthLabel ? ` (${metric.monthLabel})` : ""}</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                <TrendIcon
                  className="h-3 w-3"
                  style={{ color: metric.trend === "up" ? "hsl(var(--color-positive))" : "hsl(var(--color-negative))" }}
                />
                <span style={{ color: metric.trend === "up" ? "hsl(var(--color-positive))" : "hsl(var(--color-negative))" }}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
