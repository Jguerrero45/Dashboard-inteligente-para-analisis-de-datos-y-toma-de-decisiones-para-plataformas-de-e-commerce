"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCurrency } from "@/hooks/use-currency"

const topProductsData = [
  { producto: "Laptop Pro", ventas: 45000, unidades: 125 },
  { producto: "Mouse Gamer", ventas: 38000, unidades: 340 },
  { producto: "Teclado RGB", ventas: 32000, unidades: 280 },
  { producto: "Monitor 4K", ventas: 28000, unidades: 95 },
  { producto: "Webcam HD", ventas: 22000, unidades: 210 },
]

export function TopProductsChart() {
  const { formatPrice } = useCurrency()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
        <CardDescription>Top 5 productos por ingresos generados</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            ventas: {
              label: "Ventas",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="producto" type="category" width={100} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => formatPrice(value)} />
              <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[0, 4, 4, 0]} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
