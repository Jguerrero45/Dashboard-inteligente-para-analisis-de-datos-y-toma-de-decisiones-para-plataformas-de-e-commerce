"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"
import { getApiBase } from "@/lib/activeStore"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export function SalesChart() {
  const [data, setData] = useState<any[]>([])
  const [year, setYear] = useState<string>(format(new Date(), "yyyy"))
  const [compareYear, setCompareYear] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (y?: string, compYear?: string) => {
    setLoading(true)
    setError(null)
    let mounted = true
    const API_BASE = getApiBase()
    const params = new URLSearchParams()
    if (y) params.set("year", y)
    const fetchCurrent = fetch(`${API_BASE}/metrics/sales-monthly/?` + params.toString()).then(r => r.json())
    let fetchPrev: Promise<any> | null = null
    if (compYear) {
      const paramsPrev = new URLSearchParams()
      paramsPrev.set("year", compYear)
      fetchPrev = fetch(`${API_BASE}/metrics/sales-monthly/?` + paramsPrev.toString()).then(r => r.json())
    }
    try {
      const [currentData, prevData] = await Promise.all([fetchCurrent, fetchPrev || Promise.resolve(null)])
      if (!mounted) return
      let mapped = []
      if (Array.isArray(currentData)) {
        mapped = currentData.map((it: any) => {
          const salesSum = Number(it.sales_sum ?? it.sales ?? 0)
          let salesPrev = 0
          if (prevData && Array.isArray(prevData)) {
            const prevItem = prevData.find((p: any) => p.month_label === it.month_label)
            if (prevItem) salesPrev = Number(prevItem.sales_sum ?? prevItem.sales ?? 0)
          }
          return {
            month: it.month_label,
            sales: salesSum,
            sales_prev: salesPrev,
          }
        })
      }
      setData(mapped)
    } catch (err) {
      if (mounted) setError(String(err))
    } finally {
      if (mounted) setLoading(false)
    }
    return () => { mounted = false }
  }

  useEffect(() => {
    loadData(year, compareYear)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mantener los valores en la unidad original (USD) y usar `formatPrice` para
  // formatear/convertir según la moneda activa. Evitamos conversiones manuales
  // que pueden provocar doble-conversión.
  const chartData = data
  const displayData = chartData

  const chartConfig = {
    sales: {
      label: "Ventas",
      color: "hsl(var(--chart-1))",
    },
    sales_prev: {
      label: "Ventas Año Anterior",
      color: "hsl(var(--chart-2))",
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
            <CardTitle>Ventas Anuales</CardTitle>
            <CardDescription>Evolución de ventas en el año seleccionado</CardDescription>
          </div>
          <ChartInfo title="Ventas Anuales">
            <p className="text-sm">Muestra el total de ventas por mes en el año seleccionado. Cada punto/área representa las ventas agregadas del mes.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm">Año</label>
          <select
            value={year}
            onChange={(e) => { const y = e.target.value; setYear(y); loadData(y, compareYear) }}
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
          <label className="text-sm">Comparar con</label>
          <select
            value={compareYear}
            onChange={(e) => { const cy = e.target.value; setCompareYear(cy); loadData(year, cy) }}
            className="rounded px-2 py-1"
            style={{
              backgroundColor: 'hsl(var(--color-popover))',
              color: 'hsl(var(--color-popover-foreground))',
              borderColor: 'hsl(var(--color-border))',
            }}
          >
            <option value="">Ninguno</option>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = String(Number(format(new Date(), 'yyyy')) - i)
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
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
              <linearGradient id="salesPrevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
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
            {compareYear && (
              <Area
                type="monotone"
                dataKey="sales_prev"
                stroke="hsl(var(--chart-2))"
                fill="url(#salesPrevGradient)"
                strokeWidth={2}
                dot={{ r: 4, stroke: 'hsl(var(--color-card-foreground))', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}