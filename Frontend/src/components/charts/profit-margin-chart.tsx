"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"

export function ProfitMarginChart() {
    const { currency, exchangeRate } = useCurrency()

    const raw = [
        { category: "Electrónica", revenue: 12000, cost: 8000 },
        { category: "Ropa", revenue: 8000, cost: 5000 },
        { category: "Hogar", revenue: 6000, cost: 4000 },
        { category: "Deportes", revenue: 9000, cost: 6000 },
        { category: "Libros", revenue: 4000, cost: 2500 },
    ]

    const data = raw.map((item) => {
        const revenue = currency === "VES" ? item.revenue * exchangeRate : item.revenue
        const cost = currency === "VES" ? item.cost * exchangeRate : item.cost
        const profit = revenue - cost
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0
        return { ...item, revenue, cost, profit, margin }
    })

    const chartConfig = {
        profit: { label: "Ganancia", color: "hsl(var(--chart-4))" },
        margin: { label: "Margen (%)", color: "hsl(var(--chart-1))" },
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
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="category" className="text-xs" />
                        <YAxis yAxisId="left" className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar yAxisId="left" dataKey="profit" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="margin" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                </ChartContainer>
                {/* Resumen numérico exacto debajo de la gráfica */}
                <div className="mt-4 space-y-2">
                    {data.map((item) => (
                        <div key={item.category} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.category}</span>
                            <span className="font-medium">{useCurrency().formatPrice(item.revenue)} · {useCurrency().formatPrice(item.cost)} · {useCurrency().formatPrice(item.profit)} · {item.margin.toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
