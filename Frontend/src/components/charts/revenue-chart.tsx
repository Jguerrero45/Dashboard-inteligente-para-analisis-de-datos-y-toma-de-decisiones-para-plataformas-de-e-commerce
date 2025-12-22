"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"
import { useEffect, useState } from "react"

export function RevenueChart() {
  const { currency, exchangeRate, formatPrice } = useCurrency()
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
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="category" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        {/* Resumen numérico exacto debajo de la gráfica */}
        <div className="mt-4 space-y-2">
          {chartData.map((item) => (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.category}</span>
              <span className="font-medium">{formatPrice(item.revenue)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
