"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState } from "react"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

const getYear = (value?: string) => {
    if (!value) return ""
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return String(d.getFullYear())
    const match = value.match(/(\d{4})/)
    return match ? match[1] : ""
}

const buildYearSeries = (rows: any[], key: string, year: string) => {
    const months = Array.from({ length: 12 }).map((_, i) => ({
        label: format(new Date(Number(year), i, 1), 'MMM'),
        iso: format(new Date(Number(year), i, 1), 'yyyy-MM'),
    }))

    const lookup = new Map<string, any>()
    rows.forEach((r) => {
        const iso = (r.month_iso || r.month || '').toString()
        if (getYear(iso) === year) lookup.set(iso.slice(0, 7), r)
    })

    return months.map((m) => {
        const hit = lookup.get(m.iso)
        return {
            month: m.label,
            [key]: hit ? Number(hit[key] ?? hit.sales_count ?? 0) : 0,
        }
    })
}

export function OrdersChart() {
    const [data, setData] = useState<any[]>([])
    const [year, setYear] = useState<string>(format(new Date(), 'yyyy'))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadData = (y?: string) => {
        setLoading(true)
        setError(null)
        let mounted = true
        const params = new URLSearchParams({ months: '12' })
        if (y) params.set('year', y)
        fetch('/api/metrics/sales-monthly/?' + params.toString())
            .then((r) => r.json())
            .then((json) => {
                if (!mounted) return
                if (Array.isArray(json)) {
                    const mapped = json.map((it: any) => ({ month: it.month_iso || it.month, month_label: it.month_label || it.month, orders: Number(it.sales_count ?? 0) }))
                    setData(mapped)
                } else {
                    setData([])
                }
            })
            .catch((err) => { setError(String(err)) })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }

    useEffect(() => {
        loadData(year)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const chartConfig = { orders: { label: 'Pedidos', color: 'hsl(var(--chart-3))' } }
    const onMove = useCallback((_e: any) => {
        // placeholder for tooltip interaction
    }, [])

    const displayData = buildYearSeries(data, 'orders', year)

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
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm">Año</label>
                    <select
                        value={year}
                        onChange={(e) => { const y = e.target.value; setYear(y); loadData(y) }}
                        className="rounded px-2 py-1"
                        style={{
                            backgroundColor: 'hsl(var(--color-popover))',
                            color: 'hsl(var(--color-popover-foreground))',
                            borderColor: 'hsl(var(--color-border))',
                        }}
                    >
                        {Array.from({ length: 5 }).map((_, i) => {
                            const y = String(Number(format(new Date(), 'yyyy')) - i)
                            return <option key={y} value={y}>{y}</option>
                        })}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => loadData(year)} className="ml-2">Aplicar</Button>
                    <Button variant="outline" size="sm" onClick={() => { const y = format(new Date(), 'yyyy'); setYear(y); loadData(y); }} className="ml-2">Reset</Button>
                    {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
                    {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={displayData} onMouseMove={onMove} onMouseLeave={() => { }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                            <Tooltip data={displayData} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, displayData.length - 1)} shared={true} />
                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6, stroke: 'hsl(var(--chart-3))', strokeWidth: 2, fill: 'white' }} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
