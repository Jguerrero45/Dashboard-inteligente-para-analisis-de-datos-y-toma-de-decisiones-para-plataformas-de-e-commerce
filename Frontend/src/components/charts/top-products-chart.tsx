"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
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
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top 5 productos por ingresos generados</CardDescription>
          </div>
          <ChartInfo title="Productos Más Vendidos">
            <p className="text-sm">Lista de los productos que generaron más ingresos en el periodo seleccionado.</p>
          </ChartInfo>
        </div>
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
              <Bar dataKey="ventas" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        {/* Resumen numérico exacto debajo de la gráfica */}
        <div className="mt-4 space-y-2">
          {topProductsData.map((p) => (
            <div key={p.producto} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{p.producto}</span>
              <span className="font-medium">{formatPrice(p.ventas)} · {p.unidades} unidades</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
