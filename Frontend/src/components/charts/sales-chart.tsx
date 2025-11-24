"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"

export function SalesChart() {
  const { currency, exchangeRate } = useCurrency()

  const data = [
    { month: "Ene", sales: 4000 },
    { month: "Feb", sales: 3000 },
    { month: "Mar", sales: 5000 },
    { month: "Abr", sales: 4500 },
    { month: "May", sales: 6000 },
    { month: "Jun", sales: 5500 },
    { month: "Jul", sales: 7000 },
  ].map((item) => ({
    ...item,
    sales: currency === "VES" ? item.sales * exchangeRate : item.sales,
  }))

  const chartConfig = {
    sales: {
      label: "Ventas",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Ventas Mensuales</CardTitle>
            <CardDescription>Evolución de ventas en los últimos 7 meses</CardDescription>
          </div>
          <ChartInfo title="Ventas Mensuales">
            <p className="text-sm">Muestra el total de ventas por mes. Cada punto/área representa las ventas agregadas del mes.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-1))"
              fill="url(#salesGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        {/* Resumen numérico exacto debajo de la gráfica */}
        <div className="mt-4 space-y-2">
          {data.map((d) => (
            <div key={d.month} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{d.month}</span>
              <span className="font-medium">{useCurrency().formatPrice(d.sales)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
