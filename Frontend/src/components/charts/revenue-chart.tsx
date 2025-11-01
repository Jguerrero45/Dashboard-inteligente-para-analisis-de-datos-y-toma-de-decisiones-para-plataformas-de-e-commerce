"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"

export function RevenueChart() {
  const { currency, exchangeRate } = useCurrency()

  const data = [
    { category: "Electrónica", revenue: 12000, cost: 8000 },
    { category: "Ropa", revenue: 8000, cost: 5000 },
    { category: "Hogar", revenue: 6000, cost: 4000 },
    { category: "Deportes", revenue: 9000, cost: 6000 },
    { category: "Libros", revenue: 4000, cost: 2500 },
  ].map((item) => ({
    ...item,
    revenue: currency === "VES" ? item.revenue * exchangeRate : item.revenue,
    cost: currency === "VES" ? item.cost * exchangeRate : item.cost,
  }))

  const chartConfig = {
    revenue: {
      label: "Ingresos",
      color: "hsl(var(--chart-2))",
    },
    cost: {
      label: "Costos",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Ingresos por Categoría</CardTitle>
            <CardDescription>Comparación de ingresos vs costos por categoría</CardDescription>
          </div>
          <ChartInfo title="Ingresos por Categoría">
            <p className="text-sm">Compara los ingresos y costos por categoría. Las barras muestran ingresos y costos asociados.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="category" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
