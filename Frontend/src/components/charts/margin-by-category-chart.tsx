"use client"


import { useEffect, useMemo, useState } from "react"
import { getApiBase } from "@/lib/activeStore"
import { useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { Button } from "@/components/ui/button"
import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"

interface CategoryMargin {
    categoria: string
    marginPct: number
    revenue: number
    cost: number
}

export function MarginByCategoryChart() {

    const [data, setData] = useState<CategoryMargin[]>([])
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
    const [error, setError] = useState<string | null>(null)

    const load = async (m?: string) => {
        setLoading(true)
        setError(null)
        let mounted = true
        try {
            const API_BASE = getApiBase()
            const params = new URLSearchParams()
            if (m) params.set('month', m)
            const res = await fetch(`${API_BASE}/metrics/revenue-by-category/${params.toString() ? `?${params}` : ''}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()
            if (!mounted) return
            const mapped = (json as Array<{ category: string; revenue: number; cost: number; margin_pct?: number }>).map((d) => {
                const marginPct = typeof d.margin_pct === "number" ? d.margin_pct : d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0
                return {
                    categoria: d.category,
                    revenue: d.revenue,
                    cost: d.cost,
                    marginPct: Math.round(marginPct * 10) / 10,
                }
            })
            setData(mapped)
        } catch (err: any) {
            if (mounted) {
                setData([])
                setError(String(err))
            }
        } finally {
            if (mounted) setLoading(false)
        }
        return () => { mounted = false }
    }

    useEffect(() => {
        load(month)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const sorted = useMemo(() => [...data].sort((a, b) => b.marginPct - a.marginPct), [data])
    const onMove = useCallback((_e: any) => {
        // placeholder for future interaction
    }, [])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>Margen por Categoría</CardTitle>
                        <CardDescription>Margen porcentual actual (30 días)</CardDescription>
                    </div>
                    <ChartInfo title="Margen por Categoría">
                        <p className="text-sm">Calculado como (ingreso - costo) / ingreso para la ventana reciente.</p>
                    </ChartInfo>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm">Mes</label>
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="rounded px-2 py-1"
                        style={{
                            backgroundColor: 'hsl(var(--color-popover))',
                            color: 'hsl(var(--color-popover-foreground))',
                            borderColor: 'hsl(var(--color-border))',
                        }}
                    >
                        {Array.from({ length: 12 }).map((_, i) => {
                            const d = subMonths(new Date(), i)
                            const key = format(d, 'yyyy-MM')
                            const label = format(d, 'MMM yyyy', { locale: es })
                            return <option key={key} value={key}>{label}</option>
                        })}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => load(month)} className="ml-2">Aplicar</Button>
                    <Button variant="outline" size="sm" onClick={() => { const m = format(new Date(), 'yyyy-MM'); setMonth(m); load(m); }} className="ml-2">Restablecer</Button>
                    {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
                    {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
                </div>
                <ChartContainer config={{ marginPct: { label: "Margen %", color: "hsl(var(--chart-4))" } }} className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sorted} margin={{ bottom: 24 }} onMouseMove={onMove} onMouseLeave={() => { }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="categoria" angle={-20} textAnchor="end" interval={0} height={60} />
                            <YAxis domain={[0, "auto"]} />
                            <Tooltip data={sorted} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, sorted.length - 1)} shared={true} />
                            <Bar dataKey="marginPct" fill="hsl(var(--chart-4))" name="Margen Actual %" radius={[6, 6, 0, 0]} activeBar={{ stroke: 'hsl(var(--chart-4))', strokeWidth: 3 }} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                {loading && <p className="text-sm text-muted-foreground mt-2">Cargando...</p>}
                {!loading && sorted.length === 0 && <p className="text-sm text-muted-foreground mt-2">Sin datos disponibles.</p>}
            </CardContent>
        </Card>
    )
}