"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"
import { useCurrency } from "@/hooks/use-currency"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getApiBase } from "@/lib/activeStore"

const getYear = (value?: string) => {
  if (!value) return ""
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return String(d.getFullYear())
  const match = value.match(/(\d{4})/)
  return match ? match[1] : ""
}

const buildYearView = (months: string[], series: any[], year: string, monthsIso?: string[]) => {
  const monthMeta = Array.from({ length: 12 }).map((_, i) => ({
    label: format(new Date(Number(year), i, 1), 'MMM', { locale: es }),
    iso: format(new Date(Number(year), i, 1), 'yyyy-MM'),
  }))

  const backendMonthToIdx = new Map<string, number>()
  const backendMonths = (monthsIso && monthsIso.length === months.length) ? monthsIso : months
  backendMonths.forEach((m, idx) => {
    const key = m.slice(0, 7)
    backendMonthToIdx.set(key, idx)
  })

  const chartData = monthMeta.map((m) => {
    const row: any = { month: m.label }
    series.forEach((s: any) => {
      const key = s.cliente || `Cliente ${s.cliente_id}`
      const srcIdx = backendMonthToIdx.get(m.iso)
      row[key] = typeof srcIdx === 'number' ? Number(s.monthly?.[srcIdx] ?? 0) : 0
    })
    return row
  })

  const detailBySeries: Record<string, number[]> = {}
  series.forEach((s: any) => {
    const key = s.cliente || `Cliente ${s.cliente_id}`
    detailBySeries[key] = monthMeta.map((m) => {
      const srcIdx = backendMonthToIdx.get(m.iso)
      return typeof srcIdx === 'number' ? Number(s.monthly?.[srcIdx] ?? 0) : 0
    })
  })

  return { chartData, monthLabels: monthMeta.map((m) => m.label), detailBySeries }
}

export function CustomersChart() {
  const [data, setData] = useState<any[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [series, setSeries] = useState<any[]>([])
  const { formatPrice } = useCurrency()
  const [year, setYear] = useState<string>(format(new Date(), 'yyyy'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailBySeries, setDetailBySeries] = useState<Record<string, number[]>>({})
  const [monthLabels, setMonthLabels] = useState<string[]>([])

  const loadData = (y?: string) => {
    setLoading(true)
    setError(null)
    let mounted = true
    const API_BASE = getApiBase()
    const params = new URLSearchParams({ months: '12', limit: '5' })
    if (y) params.set('year', y)
    fetch(`${API_BASE}/metrics/top-customers-monthly/?` + params.toString())
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        if (json && Array.isArray(json.months) && Array.isArray(json.series)) {
          const monthsIso = Array.isArray(json.months_iso) ? json.months_iso : undefined
          setMonths(json.months)
          setSeries(json.series)
          const targetYear = y || format(new Date(), 'yyyy')
          const { chartData, monthLabels, detailBySeries } = buildYearView(json.months, json.series, targetYear, monthsIso)
          setData(chartData)
          setDetailBySeries(detailBySeries)
          setMonthLabels(monthLabels)
        } else {
          setMonths([])
          setSeries([])
          setData([])
          setDetailBySeries({})
          setMonthLabels([])
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

  const chartConfig = {}

  const palette = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({})
  const onMove = useCallback((_e: any) => {
    // placeholder for tooltip interaction
  }, [])

  const toggleExpanded = (id: string | number) => {
    const key = String(id)
    setExpandedClients((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const displayData = data
  const displayMonths = monthLabels

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Mejores clientes</CardTitle>
            <CardDescription>Comparativa de gasto anual de los clientes con mayor gasto</CardDescription>
          </div>
          <ChartInfo title="Clientes">
            <p className="text-sm">Muestra los clientes que más gastaron y permite ver el detalle anual al pulsar "...".</p>
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
          <Button variant="outline" size="sm" onClick={() => { const y = format(new Date(), 'yyyy'); setYear(y); loadData(y); }} className="ml-2">Restablecer</Button>
          {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
          {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
        </div>
        <ChartContainer config={chartConfig} className="h-[340px] w-full">
          <LineChart data={displayData} onMouseMove={onMove} onMouseLeave={() => { }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip data={displayData} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, displayData.length - 1)} shared={true} />
            {/* one Line per top client */}
            {series.map((s: any, i: number) => {
              const key = s.cliente || `Cliente ${s.cliente_id}`
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={palette[i % palette.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6, stroke: palette[i % palette.length], strokeWidth: 2, fill: 'white' }}
                  name={key}
                />
              )
            })}
          </LineChart>
        </ChartContainer>
        {/* Resumen: cada cliente muestra un punto de color, nombre, total y botón '...' para desplegar detalle anual */}
        <div className="mt-4 space-y-3">
          {series.map((s: any, i: number) => {
            const id = s.cliente_id
            const key = String(id)
            const color = palette[i % palette.length]
            const isExpanded = !!expandedClients[key]
            return (
              <div key={key} className="space-y-1 border-b pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium">{s.cliente}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Total: <strong>{formatPrice(s.total)}</strong></span>
                    <button
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpanded(id)}
                      className="text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      ...
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                    {displayMonths.map((m: string, idx: number) => (
                      <div key={m} className="flex items-center justify-between">
                        <span className="font-medium">{m}</span>
                        <span>{formatPrice((detailBySeries[s.cliente || `Cliente ${s.cliente_id}`] || [])[idx] || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}