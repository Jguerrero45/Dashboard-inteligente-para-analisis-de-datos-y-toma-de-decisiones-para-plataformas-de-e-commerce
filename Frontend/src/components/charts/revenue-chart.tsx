"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"
import { getApiBase } from "@/lib/activeStore"
import { fetchJson } from "@/lib/fetch-json"
import { format } from "date-fns"
import { getYearOptions } from "@/lib/plan-years"

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])
  const [year, setYear] = useState<string>(format(new Date(), 'yyyy'))
  const [compareYear, setCompareYear] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadData = async (y?: string, compYear?: string) => {
    setLoading(true)
    setError(null)
    let mounted = true
    const API_BASE = getApiBase()
    const params = new URLSearchParams()
    if (y) params.set('year', y)
    const fetchCurrent = fetchJson<any[]>(`${API_BASE}/metrics/revenue-by-category/` + (params.toString() ? `?${params}` : ''), undefined, [])
    let fetchPrev: Promise<any> | null = null
    if (compYear) {
      const paramsPrev = new URLSearchParams()
      paramsPrev.set('year', compYear)
      fetchPrev = fetchJson<any[]>(`${API_BASE}/metrics/revenue-by-category/` + (paramsPrev.toString() ? `?${paramsPrev}` : ''), undefined, [])
    }
    try {
      const [currentData, prevData] = await Promise.all([fetchCurrent, fetchPrev || Promise.resolve(null)])
      if (mounted) {
        if (Array.isArray(currentData)) {
          let mapped = currentData
          if (prevData && Array.isArray(prevData)) {
            mapped = currentData.map((item: any) => {
              const prevItem = prevData.find((p: any) => p.category === item.category)
              return {
                ...item,
                revenue_prev: prevItem ? prevItem.revenue : 0,
              }
            })
          }
          setData(mapped)
        } else {
          setData([])
        }
        const isStoreC = getApiBase() === '/api3'
        const currentYear = y || year
        setMessage(isStoreC && ['2022', '2023', '2024'].includes(currentYear) ? "Datos simulados para el plan de trabajo" : null)
      }
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
  }, [year, compareYear])

  // Mantener valores crudos (USD) y delegar formateo/conversión a `formatPrice`
  const chartData = data.map((item) => ({ ...item }))

  const chartConfig = {
    revenue: {
      label: "Ingresos",
      color: "hsl(var(--chart-2))",
    },
    revenue_prev: {
      label: "Ingresos Año Anterior",
      color: "hsl(var(--chart-3))",
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
            <CardTitle>Ingresos por Categoría Anual</CardTitle>
            <CardDescription>Ingresos por categoría en el año seleccionado</CardDescription>
          </div>
          <ChartInfo title="Ingresos por Categoría Anual">
            <p className="text-sm">Muestra los ingresos por categoría en el año seleccionado.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded px-2 py-1"
            style={{
              backgroundColor: 'hsl(var(--color-popover))',
              color: 'hsl(var(--color-popover-foreground))',
              borderColor: 'hsl(var(--color-border))',
            }}
          >
            {getYearOptions(getApiBase() === '/api3').map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label className="text-sm">Comparar con</label>
          <select
            value={compareYear}
            onChange={(e) => { const cy = e.target.value; setCompareYear(cy) }}
            className="rounded px-2 py-1"
            style={{
              backgroundColor: 'hsl(var(--color-popover))',
              color: 'hsl(var(--color-popover-foreground))',
              borderColor: 'hsl(var(--color-border))',
            }}
          >
            <option value="">Ninguno</option>
            {getYearOptions(getApiBase() === '/api3').map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
          {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
        </div>
        {message && <div className="text-sm text-blue-600 mb-2">{message}</div>}
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} onMouseMove={onMove} onMouseLeave={() => { }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="category" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              data={chartData}
              content={renderTooltipWithoutRange}
              wrapperStyle={{ background: 'var(--color-background)', color: 'var(--color-foreground)', opacity: 1 }}
              defaultIndex={Math.max(0, chartData.length - 1)}
              shared={true}
            />
            <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Ingresos" activeBar={{ stroke: 'hsl(var(--chart-2))', strokeWidth: 3 }} />
            {compareYear && <Bar dataKey="revenue_prev" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} activeBar={{ stroke: 'hsl(var(--chart-3))', strokeWidth: 3 }} />}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}