"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, Sector } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"

export function ProductsChart() {
  const [months, setMonths] = useState<string[]>([])
  const [series, setSeries] = useState<Array<any>>([])
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let mounted = true
    fetch('/api/metrics/top-categories-monthly/?months=12&limit=6')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        if (json && Array.isArray(json.months) && Array.isArray(json.series)) {
          setMonths(json.months)
          setSeries(json.series)
          // build chart data if needed in future: months x categories
        }
      })
      .catch(() => { })
    return () => { mounted = false }
  }, [])

  const palette = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

  // compute totals and slices from series
  const totalUnits = series.reduce((s, it) => s + (Number(it.total) || 0), 0)
  const slices = series.map((s: any, i: number) => ({ name: s.category, value: totalUnits > 0 ? (Number(s.total) / totalUnits) * 100 : 0, fill: palette[i % palette.length], rawUnits: Number(s.total) }))

  const onMove = useCallback((_e: any) => {
    // tooltip handles active index; keep placeholder
  }, [])



  const toggleExpanded = (cat: string) => setExpandedCats((p) => ({ ...p, [cat]: !p[cat] }))

  const formatNumber = (n: number) => new Intl.NumberFormat('es-ES').format(n)

  const chartConfig = { value: { label: 'Porcentaje' } }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Distribución de Productos</CardTitle>
            <CardDescription>Unidades vendidas por categoría (Top 6)</CardDescription>
          </div>
          <ChartInfo title="Distribución de Productos">
            <p className="text-sm">Muestra las categorías con más unidades vendidas. Haz clic en "..." para ver el detalle mensual por categoría.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart onMouseMove={onMove} onMouseLeave={() => { }}>
            <Tooltip data={slices} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={0} shared={false} />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              activeShape={(props: any) => <Sector {...props} outerRadius={props.outerRadius + 8} />}
              label={(props: any) => {
                const { x, y, percent, payload } = props
                const pct = (payload && typeof payload.value === 'number') ? payload.value : (percent * 100)
                const text = `${pct.toFixed(2)}% - ${payload && payload.name ? payload.name : ''}`
                return (
                  <text x={x} y={y} fill={"hsl(var(--color-foreground))"} fontSize={10} textAnchor="middle" dominantBaseline="central">
                    {text}
                  </text>
                )
              }}
            >
              {slices.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>

        </ChartContainer>

        {/* Resumen con punto de color, nombre, total y botón '...' */}
        <div className="mt-4 space-y-2">
          {series.map((s: any, i: number) => {
            const key = s.category || `cat-${i}`
            const color = palette[i % palette.length]
            const isExpanded = !!expandedCats[key]
            return (
              <div key={key} className="space-y-1 border-b pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium">{s.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Total: <strong>{formatNumber(Number(s.total || 0))}</strong></span>
                    <button onClick={() => toggleExpanded(key)} className="text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">...</button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                    {months.map((m: string, idx: number) => (
                      <div key={m} className="flex items-center justify-between">
                        <span className="font-medium">{m}</span>
                        <span>{formatNumber(Number(s.monthly[idx] || 0))}</span>
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
