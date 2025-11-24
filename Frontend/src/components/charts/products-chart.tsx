"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"

export function ProductsChart() {
  const data = [
    { name: "Laptops", value: 35, fill: "hsl(var(--chart-1))" },
    { name: "Smartphones", value: 25, fill: "hsl(var(--chart-2))" },
    { name: "Accesorios", value: 20, fill: "hsl(var(--chart-3))" },
    { name: "Audio", value: 12, fill: "hsl(var(--chart-4))" },
    { name: "Otros", value: 8, fill: "hsl(var(--chart-5))" },
  ]

  const chartConfig = {
    value: {
      label: "Porcentaje",
    },
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Distribución de Productos</CardTitle>
            <CardDescription>Porcentaje de ventas por tipo de producto</CardDescription>
          </div>
          <ChartInfo title="Distribución de Productos">
            <p className="text-sm">Muestra la proporción de ventas por tipo de producto (porcentaje del total).</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Resumen numérico exacto debajo de la gráfica */}
        <div className="mt-4 space-y-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium">{entry.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
