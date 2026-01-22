"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState } from "react"
import { useCallback } from "react"

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
    const onMove = useCallback((_e: any) => {
        // placeholder for tooltip interaction
    }, [])

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
                    <LineChart data={data} onMouseMove={onMove} onMouseLeave={() => { }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip data={data} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, data.length - 1)} shared={true} />
                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6, stroke: 'hsl(var(--chart-3))', strokeWidth: 2, fill: 'white' }} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
