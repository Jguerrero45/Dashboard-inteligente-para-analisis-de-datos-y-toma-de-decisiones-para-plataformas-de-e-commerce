"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"


interface CategoryValue {
    category: string
    revenue: number
    cost: number
}

export function CategoryPerformanceRadar() {

    const [data, setData] = useState<CategoryValue[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const res = await fetch("/api/metrics/revenue-by-category/?days=30")
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
