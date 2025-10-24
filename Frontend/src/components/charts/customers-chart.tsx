"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function CustomersChart() {
  const data = [
    { month: "Ene", nuevos: 120, recurrentes: 340 },
    { month: "Feb", nuevos: 150, recurrentes: 380 },
    { month: "Mar", nuevos: 180, recurrentes: 420 },
    { month: "Abr", nuevos: 140, recurrentes: 450 },
    { month: "May", nuevos: 200, recurrentes: 490 },
    { month: "Jun", nuevos: 170, recurrentes: 520 },
    { month: "Jul", nuevos: 220, recurrentes: 560 },
  ]

  const chartConfig = {
    nuevos: {
      label: "Nuevos",
      color: "hsl(var(--chart-4))",
    },
    recurrentes: {
      label: "Recurrentes",
      color: "hsl(var(--chart-5))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Nuevos vs Recurrentes</CardTitle>
        <CardDescription>Evolución de la base de clientes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="nuevos" stroke="hsl(var(--chart-4))" strokeWidth={2} />
            <Line type="monotone" dataKey="recurrentes" stroke="hsl(var(--chart-5))" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
