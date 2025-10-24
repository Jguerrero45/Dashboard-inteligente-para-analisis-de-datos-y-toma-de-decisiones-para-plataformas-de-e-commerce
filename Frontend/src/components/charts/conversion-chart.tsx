"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const conversionData = [
  { mes: "Ene", visitas: 12500, carritos: 3200, compras: 1850 },
  { mes: "Feb", visitas: 14200, carritos: 3800, compras: 2100 },
  { mes: "Mar", visitas: 13800, carritos: 3500, compras: 1950 },
  { mes: "Abr", visitas: 16500, carritos: 4200, compras: 2450 },
  { mes: "May", visitas: 15200, carritos: 4000, compras: 2300 },
  { mes: "Jun", visitas: 17800, carritos: 4800, compras: 2850 },
]

export function ConversionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo de Conversión</CardTitle>
        <CardDescription>Análisis del proceso de compra de los usuarios</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            visitas: {
              label: "Visitas",
              color: "hsl(var(--chart-1))",
            },
            carritos: {
              label: "Carritos",
              color: "hsl(var(--chart-2))",
            },
            compras: {
              label: "Compras",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="visitas"
                stackId="1"
                stroke="var(--color-visitas)"
                fill="var(--color-visitas)"
                fillOpacity={0.6}
                name="Visitas"
              />
              <Area
                type="monotone"
                dataKey="carritos"
                stackId="2"
                stroke="var(--color-carritos)"
                fill="var(--color-carritos)"
                fillOpacity={0.6}
                name="Carritos"
              />
              <Area
                type="monotone"
                dataKey="compras"
                stackId="3"
                stroke="var(--color-compras)"
                fill="var(--color-compras)"
                fillOpacity={0.6}
                name="Compras"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-chart-1">16.0%</p>
            <p className="text-xs text-muted-foreground">Tasa de Conversión</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-chart-2">25.6%</p>
            <p className="text-xs text-muted-foreground">Abandono de Carrito</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-chart-3">59.4%</p>
            <p className="text-xs text-muted-foreground">Conversión Carrito</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
