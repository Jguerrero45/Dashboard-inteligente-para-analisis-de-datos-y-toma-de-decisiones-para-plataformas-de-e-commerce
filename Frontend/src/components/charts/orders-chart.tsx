"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState } from "react"

export function OrdersChart() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        let mounted = true
        fetch('/api/metrics/sales-monthly/?months=12')
            .then((r) => r.json())
            .then((json) => {
                if (!mounted) return
                if (Array.isArray(json)) {
                    const mapped = json.map((it: any) => ({ month: it.month, orders: Number(it.sales_count ?? 0) }))
                    setData(mapped)
                }
            })
            .catch(() => { })
        return () => { mounted = false }
    }, [])

    const chartConfig = { orders: { label: 'Pedidos', color: 'hsl(var(--chart-3))' } }
    const nf = new Intl.NumberFormat('es-ES')

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>Pedidos Mensuales</CardTitle>
                        <CardDescription>Cantidad de pedidos (ventas completadas) por mes</CardDescription>
                    </div>
                    <ChartInfo title="Pedidos Mensuales">
                        <p className="text-sm">Cuenta de ventas con estado completada por mes. Útil para evaluar volumen de transacciones efectivas.</p>
                    </ChartInfo>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                    {data.map((d) => (
                        <div key={d.month} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{d.month}</span>
                            <span className="font-medium">{nf.format(d.orders)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
