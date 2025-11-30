"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState } from "react"

export function ProductsChart() {
  const [raw, setRaw] = useState<Array<{ category: string; revenue: number }>>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/metrics/revenue-by-category/')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        if (Array.isArray(json)) {
          // backend returns { category, revenue, cost } per item
          const normalized = json.map((it: any) => ({ category: it.category || 'Sin categoría', revenue: Number(it.revenue || 0) }))
          setRaw(normalized.sort((a, b) => b.revenue - a.revenue))
        }
      })
      .catch(() => { })
    return () => { mounted = false }
  }, [])

  const total = raw.reduce((s, r) => s + r.revenue, 0)

  // take top N categories to show as slices, aggregate the rest into 'Otros'
  const TOP_N = 4
  const top = raw.slice(0, TOP_N)
  const others = raw.slice(TOP_N)
  const othersSum = others.reduce((s, r) => s + r.revenue, 0)

  const palette = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

  const slices = [
    ...top.map((t, i) => ({ name: t.category, value: total > 0 ? (t.revenue / total) * 100 : 0, fill: palette[i % palette.length], rawRevenue: t.revenue })),
  ]
  if (others.length > 0) {
    slices.push({ name: 'Otros', value: total > 0 ? (othersSum / total) * 100 : 0, fill: palette[4 % palette.length], rawRevenue: othersSum })
  }

  const chartConfig = { value: { label: 'Porcentaje' } }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Distribución de Productos</CardTitle>
            <CardDescription>Porcentaje de ventas por tipo de producto</CardDescription>
          </div>
          <ChartInfo title="Distribución de Productos">
            <p className="text-sm">Muestra la proporción de ventas por tipo de producto (porcentaje del total). Haz clic en "Otros" para ver el detalle.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            {/* Custom label: show percentage (2 decimals) and category inside slice */}
            {/**
             * Recharts passes label props; we use payload to show `${value.toFixed(2)}% - ${name}`
             */}
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(props: any) => {
                const { x, y, midAngle, outerRadius, percent, index, payload } = props
                const pct = (payload && typeof payload.value === 'number') ? payload.value : (percent * 100)
                const text = `${pct.toFixed(2)}% - ${payload && payload.name ? payload.name : ''}`
                return (
                  <text x={x} y={y} fill="#ffffff" fontSize={10} textAnchor="middle" dominantBaseline="central">
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
        {/* Resumen numérico exacto debajo de la gráfica */}
        <div className="mt-4 space-y-2">
          {slices.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <div />
              <div className="flex items-center gap-2">
                <span className="font-medium">{entry.value.toFixed(2)}%</span>
                <span className="text-muted-foreground">{entry.name}</span>
                {entry.name === 'Otros' && others.length > 0 ? (
                  <button className="text-xs text-muted-foreground" onClick={() => setExpanded((s) => !s)}>{expanded ? 'ocultar' : '...'}</button>
                ) : null}
              </div>
            </div>
          ))}

          {expanded && others.length > 0 && (
            <div className="mt-2 rounded-md border p-2">
              <div className="text-sm font-medium mb-2">Detalle de Otros</div>
              <div className="space-y-1 text-sm">
                {others.map((o) => (
                  <div key={o.category} className="flex items-center justify-between">
                    <div />
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{total > 0 ? ((o.revenue / total) * 100).toFixed(2) : '0.00'}%</span>
                      <span className="text-muted-foreground">{o.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
