"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState, useCallback } from "react"

export function SalesChart() {
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
  const onMove = useCallback((_e: any) => {
    // noop: keep for potential future interaction handling
  }, [])

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
          <AreaChart data={chartData} onMouseMove={onMove} onMouseLeave={() => { }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip data={chartData} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, chartData.length - 1)} shared={true} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-1))"
              fill="url(#salesGradient)"
              strokeWidth={2}
              dot={{ r: 4, stroke: 'hsl(var(--color-card-foreground))', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
