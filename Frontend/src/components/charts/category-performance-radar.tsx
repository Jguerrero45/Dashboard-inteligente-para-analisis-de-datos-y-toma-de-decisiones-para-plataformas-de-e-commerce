"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { getApiBase } from "@/lib/activeStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { Button } from "@/components/ui/button"
import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"


interface CategoryValue {
    category: string
    revenue: number
    cost: number
}

export function CategoryPerformanceRadar() {

    const [data, setData] = useState<CategoryValue[]>([])
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
            const res = await fetch(`${API_BASE}/metrics/revenue-by-category/?days=30${params.toString() ? `&${params}` : ''}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()
            if (!mounted) return
            const items = Array.isArray(json) ? json : []
            const mapped = items.map((it: any) => ({
                category: it.category || "Sin categoría",
                revenue: Number(it.revenue) || 0,
                cost: Number(it.cost) || 0,
            }))
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

    const radarData = useMemo(() => (data.length ? data : [{ category: "Sin datos", revenue: 0, cost: 0 }]), [data])
    const onMove = useCallback((_e: any) => {
        // tooltip manages active index
    }, [])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>Rendimiento por Categoría</CardTitle>
                        <CardDescription>Ingresos actuales por categoría (30 días)</CardDescription>
                    </div>
                    <ChartInfo title="Rendimiento por Categoría">
                        <p className="text-sm">Radar de ingresos actuales por categoría para evitar redundancia con otras vistas.</p>
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
                    <Button variant="outline" size="sm" onClick={() => load(month)}>Aplicar</Button>
                    <Button variant="outline" size="sm" onClick={() => { const m = format(new Date(), 'yyyy-MM'); setMonth(m); load(m); }}>Restablecer</Button>
                    {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
                    {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
                </div>
                <ChartContainer
                    config={{
                        revenue: { label: "Ingresos", color: "hsl(var(--chart-3))" },
                        cost: { label: "Costos", color: "hsl(var(--chart-4))" },
                    }}
                    className="h-[360px]"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="75%" onMouseMove={onMove} onMouseLeave={() => { }}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                            <Tooltip data={radarData} content={renderTooltipWithoutRange} cursor={{}} defaultIndex={0} shared={false} />
                            <Legend />
                            <Radar name="Ingresos" dataKey="revenue" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.45} />
                            <Radar name="Costos" dataKey="cost" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.25} />
                        </RadarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                {loading && <p className="text-sm text-muted-foreground mt-2">Cargando...</p>}
                {!loading && data.length === 0 && <p className="text-sm text-muted-foreground mt-2">Sin datos disponibles.</p>}
            </CardContent>
        </Card>
    )
}