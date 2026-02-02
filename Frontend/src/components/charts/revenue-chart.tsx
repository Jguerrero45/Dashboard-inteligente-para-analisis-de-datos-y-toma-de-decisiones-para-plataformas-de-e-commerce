"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"
import { getApiBase } from "@/lib/activeStore"
import { Button } from "@/components/ui/button"
import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])
  const [month, setMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = (m?: string) => {
    setLoading(true)
    setError(null)
    let mounted = true
    const API_BASE = getApiBase()
    const params = new URLSearchParams()
    if (m) params.set('month', m)
    fetch(`${API_BASE}/metrics/revenue-by-category/` + (params.toString() ? `?${params}` : ''))
      .then((r) => r.json())
      .then((json) => {
        if (mounted && Array.isArray(json)) setData(json)
      })
      .catch((err) => { setError(String(err)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }

  useEffect(() => {
    loadData(month)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mantener valores crudos (USD) y delegar formateo/conversión a `formatPrice`
  const chartData = data.map((item) => ({ ...item }))

  const chartConfig = {
    revenue: {
      label: "Ingresos",
      color: "hsl(var(--chart-2))",
    },
  }
  const onMove = useCallback((_e: any) => {
    // noop - reserved for future interaction handling
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Ingresos por Categoría</CardTitle>
            <CardDescription>Ingresos (últimos 30 días)</CardDescription>
          </div>
          <ChartInfo title="Ingresos por Categoría">
            <p className="text-sm">Muestra solo los ingresos por categoría en la ventana reciente.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded px-2 py-1"
            style={{
              backgroundColor: 'hsl(var(--color-popover))',
              color: 'hsl(var(--color-popover-foreground))',
              borderColor: 'hsl(var(--color-border))',
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const d = subMonths(new Date(), i)
              const key = format(d, 'yyyy-MM')
              const label = format(d, 'MMM yyyy', { locale: es })
              return <option key={key} value={key}>{label}</option>
            })}
          </select>
          <Button variant="outline" size="sm" onClick={() => loadData(month)} className="ml-2">Aplicar</Button>
          <Button variant="outline" size="sm" onClick={() => { const m = format(new Date(), 'yyyy-MM'); setMonth(m); loadData(m); }} className="ml-2">Restablecer</Button>
          {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
          {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
        </div>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} onMouseMove={onMove} onMouseLeave={() => { }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="category" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              data={chartData}
              content={renderTooltipWithoutRange}
              cursor={{ fill: 'var(--color-background)', opacity: 1, stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }}
              wrapperStyle={{ background: 'var(--color-background)', color: 'var(--color-foreground)', opacity: 1 }}
              defaultIndex={Math.max(0, chartData.length - 1)}
              shared={true}
            />
            <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} activeBar={{ stroke: 'hsl(var(--chart-2))', strokeWidth: 3 }} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}