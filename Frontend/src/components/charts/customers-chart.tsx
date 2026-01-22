"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"
import { useCurrency } from "@/hooks/use-currency"

export function CustomersChart() {
  const [data, setData] = useState<any[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [series, setSeries] = useState<any[]>([])
  const { formatPrice } = useCurrency()

  useEffect(() => {
    let mounted = true
    fetch('/api/metrics/top-customers-monthly/?months=12&limit=5')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        if (json && Array.isArray(json.months) && Array.isArray(json.series)) {
          setMonths(json.months)
          setSeries(json.series)
          // build chart data: array of { month: label, [clientName]: value }
          const chartData = json.months.map((label: string, idx: number) => {
            const obj: any = { month: label }
            json.series.forEach((s: any) => {
              const key = s.cliente || `Cliente ${s.cliente_id}`
              obj[key] = Number(s.monthly[idx] || 0)
            })
            return obj
          })
          setData(chartData)
        }
      })
      .catch(() => { })
    return () => { mounted = false }
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Mejores clientes</CardTitle>
            <CardDescription>Comparativa de gasto mensual de los clientes con mayor gasto</CardDescription>
          </div>
          <ChartInfo title="Clientes">
            <p className="text-sm">Muestra los clientes que más gastaron y permite ver el detalle mensual al pulsar "...".</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[340px] w-full">
          <LineChart data={data} onMouseMove={onMove} onMouseLeave={() => { }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip data={data} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, data.length - 1)} shared={true} />
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
        {/* Resumen: cada cliente muestra un punto de color, nombre, total y botón '...' para desplegar detalle mensual */}
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
                    {months.map((m: string, idx: number) => (
                      <div key={m} className="flex items-center justify-between">
                        <span className="font-medium">{m}</span>
                        <span>{formatPrice(s.monthly[idx] || 0)}</span>
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
