"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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
        <CardTitle>Distribución de Productos</CardTitle>
        <CardDescription>Porcentaje de ventas por tipo de producto</CardDescription>
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
      </CardContent>
    </Card>
  )
}
