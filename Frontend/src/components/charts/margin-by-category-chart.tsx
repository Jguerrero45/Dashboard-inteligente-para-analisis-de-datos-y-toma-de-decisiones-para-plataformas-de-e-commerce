"use client"


import { useEffect, useMemo, useState } from "react"
import { useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"

interface CategoryMargin {
    categoria: string
    marginPct: number
    revenue: number
    cost: number
}

export function MarginByCategoryChart() {

    const [data, setData] = useState<CategoryMargin[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const res = await fetch("/api/metrics/revenue-by-category/")
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
            } catch (err) {
                if (mounted) setData([])
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
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
