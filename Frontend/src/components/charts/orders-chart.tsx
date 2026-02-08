"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState } from "react"
import { useCallback } from "react"
import { getApiBase } from "@/lib/activeStore"
import { fetchJson } from "@/lib/fetch-json"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { getYearOptions } from "@/lib/plan-years"

export function OrdersChart() {
    const [data, setData] = useState<any[]>([])
    const [year, setYear] = useState<string>(format(new Date(), 'yyyy'))
    const [compareYear, setCompareYear] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const isStoreC = getApiBase() === '/api3'

    const loadData = async (y?: string, compYear?: string) => {
        setLoading(true)
        setError(null)
        let mounted = true
        const API_BASE = getApiBase()
        const params = new URLSearchParams()
        if (y) params.set('year', y)
        const fetchCurrent = fetchJson<any[]>(`${API_BASE}/metrics/sales-monthly/?` + params.toString(), undefined, [])
        let fetchPrev: Promise<any> | null = null
        if (compYear) {
            const paramsPrev = new URLSearchParams()
            paramsPrev.set('year', compYear)
            fetchPrev = fetchJson<any[]>(`${API_BASE}/metrics/sales-monthly/?` + paramsPrev.toString(), undefined, [])
        }
        try {
            const [currentData, prevData] = await Promise.all([fetchCurrent, fetchPrev || Promise.resolve(null)])
            if (!mounted) return
            let mapped = []
            if (Array.isArray(currentData)) {
                mapped = currentData.map((it: any) => {
                    const orders = Number(it.sales_count ?? it.sales ?? 0)
                    let ordersPrev = 0
                    if (prevData && Array.isArray(prevData)) {
                        const prevItem = prevData.find((p: any) => p.month_label === it.month_label)
                        if (prevItem) ordersPrev = Number(prevItem.sales_count ?? prevItem.sales ?? 0)
                    }
                    return {
                        month: it.month_label,
                        orders: orders,
                        orders_prev: ordersPrev,
                    }
                })
            }
            setData(mapped)
            const currentYear = y || year
            setMessage(isStoreC && ['2022', '2023', '2024'].includes(currentYear) ? "Datos simulados para el plan de trabajo" : null)
        } catch (err) {
            if (mounted) setError(String(err))
        } finally {
            if (mounted) setLoading(false)
        }
        return () => { mounted = false }
    }

    useEffect(() => {
        loadData(year, compareYear)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, compareYear])

    const chartConfig = { orders: { label: 'Cantidad de Pedidos', color: 'hsl(var(--chart-3))' }, orders_prev: { label: 'Cantidad Pedidos Año Anterior', color: 'hsl(var(--chart-4))' } }
    const onMove = useCallback((_e: any) => {
        // placeholder for tooltip interaction
    }, [])

    const displayData = data

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>Cantidad de Pedidos Anuales</CardTitle>
                        <CardDescription>Cantidad total de pedidos (ventas completadas y pendientes) en el año seleccionado</CardDescription>
                    </div>
                    <ChartInfo title="Pedidos Anuales">
                        <p className="text-sm">Cantidad total de pedidos (ventas completadas y pendientes) por mes en el año seleccionado. Útil para evaluar el volumen de transacciones.</p>
                    </ChartInfo>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm">Año</label>
                    <select
                        value={year}
                        onChange={(e) => { const y = e.target.value; setYear(y); loadData(y, compareYear) }}
                        className="rounded px-2 py-1"
                        style={{
                            backgroundColor: 'hsl(var(--color-popover))',
                            color: 'hsl(var(--color-popover-foreground))',
                            borderColor: 'hsl(var(--color-border))',
                        }}
                    >
                        {getYearOptions(isStoreC).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <label className="text-sm">Comparar con</label>
                    <select
                        value={compareYear}
                        onChange={(e) => { const cy = e.target.value; setCompareYear(cy); loadData(year, cy) }}
                        className="rounded px-2 py-1"
                        style={{
                            backgroundColor: 'hsl(var(--color-popover))',
                            color: 'hsl(var(--color-popover-foreground))',
                            borderColor: 'hsl(var(--color-border))',
                        }}
                    >
                        <option value="">Ninguno</option>
                        {getYearOptions(isStoreC).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
                    {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
                    {message && <p className="ml-2 text-sm text-blue-600">{message}</p>}
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={displayData} onMouseMove={onMove} onMouseLeave={() => { }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip data={displayData} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, displayData.length - 1)} shared={true} />
                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6, stroke: 'hsl(var(--chart-3))', strokeWidth: 2, fill: 'white' }} name="Valor de Pedidos" />
                        {compareYear && <Line type="monotone" dataKey="orders_prev" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6, stroke: 'hsl(var(--chart-4))', strokeWidth: 2, fill: 'white' }} name="Valor Pedidos Año Anterior" />}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}