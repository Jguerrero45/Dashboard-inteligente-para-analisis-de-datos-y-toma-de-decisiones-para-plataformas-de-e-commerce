"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"
import { useEffect, useState } from "react"

export function SalesChart() {
  const { currency, exchangeRate, formatPrice } = useCurrency()
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    fetch('/api/metrics/sales-monthly/?months=12')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        if (Array.isArray(json)) {
          // compatibilidad: backend puede devolver { month, sales } o el nuevo esquema
          // Guardamos tanto el valor 'sales_sum' como 'items_revenue' para depuración
          const mapped = json.map((it: any) => {
            const salesSum = Number(it.sales_sum ?? it.sales ?? 0)
            const itemsRevenue = Number(it.items_revenue ?? it.sales ?? 0)
            return {
              month: it.month,
              sales: salesSum, // valor principal que usamos para la gráfica (ventas - cabeceras)
              sales_sum_raw: salesSum,
              items_revenue_raw: itemsRevenue,
              sales_count: Number(it.sales_count ?? it.sales_count ?? 0),
              items_count: Number(it.items_count ?? it.items_count ?? 0),
            }
          })
          setData(mapped)
        }
      })
      .catch(() => {
        // leave data empty on error
      })
    return () => {
      mounted = false
    }
  }, [])

  // Mantener los valores en la unidad original (USD) y usar `formatPrice` para
  // formatear/convertir según la moneda activa. Evitamos conversiones manuales
  // que pueden provocar doble-conversión.
  const chartData = data.map((item) => ({ ...item }))

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
            <CardDescription>Evolución de ventas en los últimos 12 meses</CardDescription>
          </div>
          <ChartInfo title="Ventas Mensuales">
            <p className="text-sm">Muestra el total de ventas por mes. Cada punto/área representa las ventas agregadas del mes.</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData}>
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
          {chartData.map((d) => (
            <div key={d.month} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{d.month}</span>
              <span className="font-medium">{formatPrice(d.sales)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
