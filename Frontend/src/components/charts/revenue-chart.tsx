"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    fetch('/api/metrics/revenue-by-category/')
      .then((r) => r.json())
      .then((json) => {
        if (mounted && Array.isArray(json)) setData(json)
      })
      .catch(() => { })
    return () => {
      mounted = false
    }
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
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} onMouseMove={onMove} onMouseLeave={() => { }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="category" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip data={chartData} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, chartData.length - 1)} shared={true} />
            <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} activeBar={{ stroke: 'hsl(var(--chart-2))', strokeWidth: 3 }} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
