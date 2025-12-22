"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState } from "react"

export function UnitsChart() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        let mounted = true
        fetch('/api/metrics/sales-monthly/?months=12')
            .then((r) => r.json())
            .then((json) => {
                if (!mounted) return
                if (Array.isArray(json)) {
                    const mapped = json.map((it: any) => ({ month: it.month, units: Number(it.items_units ?? 0) }))
                    setData(mapped)
                }
            })
            .catch(() => { })
        return () => { mounted = false }
    }, [])

    const chartConfig = { units: { label: 'Unidades', color: 'hsl(var(--chart-4))' } }
    const nf = new Intl.NumberFormat('es-ES')

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>Unidades Vendidas Mensuales</CardTitle>
                        <CardDescription>Total de unidades vendidas por mes</CardDescription>
                    </div>
                    <ChartInfo title="Unidades Vendidas">
                        <p className="text-sm">Mide el volumen de productos vendidos mensualmente (suma de cantidades).</p>
                    </ChartInfo>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="unitsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="units" stroke="hsl(var(--chart-4))" fill="url(#unitsGradient)" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                    {data.map((d) => (
                        <div key={d.month} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{d.month}</span>
                            <span className="font-medium">{nf.format(d.units)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
