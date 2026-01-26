"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"
import { getApiBase } from "@/lib/activeStore"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

const getYear = (value?: string) => {
  if (!value) return ""
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return String(d.getFullYear())
  const match = value.match(/(\d{4})/)
  return match ? match[1] : ""
}

const buildYearSeries = (rows: any[], key: string, year: string) => {
  const months = Array.from({ length: 12 }).map((_, i) => ({
    label: format(new Date(Number(year), i, 1), "MMM"),
    iso: format(new Date(Number(year), i, 1), "yyyy-MM"),
  }))

  const lookup = new Map<string, any>()
  rows.forEach((r) => {
    const iso = (r.month_iso || r.month || '').toString()
    if (getYear(iso) === year) lookup.set(iso.slice(0, 7), r)
  })

  return months.map((m) => {
    const hit = lookup.get(m.iso)
    return {
      month: m.label,
      [key]: hit ? Number(hit[key] ?? hit.sales ?? 0) : 0,
    }
  })
}

export function SalesChart() {
  const [data, setData] = useState<any[]>([])
  const [year, setYear] = useState<string>(format(new Date(), "yyyy"))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = (y?: string) => {
    setLoading(true)
    setError(null)
    let mounted = true
    const API_BASE = getApiBase()
    const params = new URLSearchParams({ months: "12" })
    if (y) params.set("year", y)
    fetch(`${API_BASE}/metrics/sales-monthly/?` + params.toString())
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        if (Array.isArray(json)) {
          const mapped = json.map((it: any) => {
            const salesSum = Number(it.sales_sum ?? it.sales ?? 0)
            const itemsRevenue = Number(it.items_revenue ?? it.sales ?? 0)
            return {
              month: it.month_iso || it.month,
              month_label: it.month_label || it.month,
              sales: salesSum,
              sales_sum_raw: salesSum,
              items_revenue_raw: itemsRevenue,
              sales_count: Number(it.sales_count ?? 0),
              items_count: Number(it.items_count ?? 0),
            }
          })
          setData(mapped)
        } else {
          setData([])
        }
      })
      .catch((err) => { setError(String(err)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }

  useEffect(() => {
    loadData(year)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mantener los valores en la unidad original (USD) y usar `formatPrice` para
  // formatear/convertir según la moneda activa. Evitamos conversiones manuales
  // que pueden provocar doble-conversión.
  const chartData = buildYearSeries(data, "sales", year)
  const displayData = chartData

  const chartConfig = {
    sales: {
      label: "Ventas",
      color: "hsl(var(--chart-1))",
    },
  }
  const onMove = useCallback((_e: any) => {
    // noop: keep for potential future interaction handling
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Ventas Mensuales</CardTitle>
            <CardDescription>Evolución de ventas en los últimos 12 meses</CardDescription>
          </div>
          <ChartInfo title="Ventas Mensuales">
            <p className="text-sm">Muestra el total de ventas por mes. Cada punto/área representa las ventas agregadas del mes.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm">Año</label>
          <select
            value={year}
            onChange={(e) => { const y = e.target.value; setYear(y); loadData(y) }}
            className="rounded px-2 py-1"
            style={{
              backgroundColor: 'hsl(var(--color-popover))',
              color: 'hsl(var(--color-popover-foreground))',
              borderColor: 'hsl(var(--color-border))',
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = String(Number(format(new Date(), 'yyyy')) - i)
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
          <Button variant="outline" size="sm" onClick={() => loadData(year)} className="ml-2">Aplicar</Button>
          <Button variant="outline" size="sm" onClick={() => { const y = format(new Date(), 'yyyy'); setYear(y); loadData(y); }} className="ml-2">Reset</Button>
          {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
          {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
        </div>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={displayData} onMouseMove={onMove} onMouseLeave={() => { }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              data={displayData}
              content={renderTooltipWithoutRange}
              cursor={{ fill: 'var(--color-background)', opacity: 1, stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }}
              wrapperStyle={{ background: 'var(--color-background)', color: 'var(--color-foreground)', opacity: 1 }}
              defaultIndex={Math.max(0, displayData.length - 1)}
              shared={true}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-1))"
              fill="url(#salesGradient)"
              strokeWidth={2}
              dot={{ r: 4, stroke: 'hsl(var(--color-card-foreground))', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
