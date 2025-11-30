"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"
import { useEffect, useState } from "react"

export function ProfitMarginChart() {
    const { currency, exchangeRate, formatPrice } = useCurrency()
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        let mounted = true
        fetch('/api/metrics/revenue-by-category/')
            .then((r) => r.json())
            .then((json) => {
                if (mounted && Array.isArray(json)) setData(json)
            })
            .catch(() => { })
        return () => {
            mounted = false
        }
    }, [])

    // Mantener valores crudos (USD). Usamos totalRevenue con valores crudos
    const totalRevenue = data.reduce((s, it) => s + (it.revenue || 0), 0)
    const computed = data.map((item) => {
        const revenue = (item.revenue || 0)
        const share = totalRevenue > 0 ? (item.revenue || 0) / totalRevenue * 100 : 0
        return { ...item, revenue, share }
    })

    const chartConfig = {
        revenue: { label: "Ingresos", color: "hsl(var(--chart-4))" },
        share: { label: "Participación (%)", color: "hsl(var(--chart-1))" },
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>Ganancias y Margen de Utilidad</CardTitle>
                        <CardDescription>Compara la ganancia absoluta y el margen porcentual por categoría</CardDescription>
                    </div>
                    <ChartInfo title="Ganancias y Margen">
                        <p className="text-sm">La barra muestra la ganancia (ingresos - costos). La línea muestra el margen de utilidad en porcentaje.</p>
                    </ChartInfo>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[340px] w-full">
                    <ComposedChart data={computed}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="category" className="text-xs" />
                        <YAxis yAxisId="left" className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="share" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                </ChartContainer>
                {/* Resumen numérico exacto debajo de la gráfica */}
                <div className="mt-4 space-y-2">
                    {computed.map((item) => (
                        <div key={item.category} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.category}</span>
                            <span className="font-medium">{formatPrice(item.revenue)} · {item.share.toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
