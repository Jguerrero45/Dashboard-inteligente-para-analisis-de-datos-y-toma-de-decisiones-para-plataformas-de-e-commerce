"use client"


import { useEffect, useMemo, useState } from "react"
import { getApiBase } from "@/lib/activeStore"
import { fetchJson } from "@/lib/fetch-json"
import { useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { getYearOptions } from "@/lib/plan-years"

interface CategoryMargin {
    categoria: string
    marginPct: number
    revenue: number
    cost: number
    marginPctPrev?: number
}

export function MarginByCategoryChart() {

    const [data, setData] = useState<CategoryMargin[]>([])
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState<string>(format(new Date(), 'yyyy'))
    const [compareYear, setCompareYear] = useState<string>("")
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const isStoreC = getApiBase() === '/api3'

    const load = async (y?: string, compYear?: string) => {
        setLoading(true)
        setError(null)
        let mounted = true
        try {
            const API_BASE = getApiBase()
            const params = new URLSearchParams()
            if (y) params.set('year', y)
            const fetchCurrent = fetchJson<any[]>(`${API_BASE}/metrics/revenue-by-category/${params.toString() ? `?${params}` : ''}`, undefined, [])
            let fetchPrev: Promise<any> | null = null
            if (compYear) {
                const paramsPrev = new URLSearchParams()
                paramsPrev.set('year', compYear)
                fetchPrev = fetchJson<any[]>(`${API_BASE}/metrics/revenue-by-category/${paramsPrev.toString() ? `?${paramsPrev}` : ''}`, undefined, [])
            }
            const [currentData, prevData] = await Promise.all([fetchCurrent, fetchPrev || Promise.resolve(null)])
            if (!mounted) return
            let mapped = (currentData as Array<{ category: string; revenue: number; cost: number; margin_pct?: number }>).map((d) => {
                const marginPct = typeof d.margin_pct === "number" ? d.margin_pct : d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0
                let marginPctPrev = 0
                if (prevData && Array.isArray(prevData)) {
                    const prevItem = prevData.find((p: any) => p.category === d.category)
                    if (prevItem) {
                        marginPctPrev = typeof prevItem.margin_pct === "number" ? prevItem.margin_pct : prevItem.revenue > 0 ? ((prevItem.revenue - prevItem.cost) / prevItem.revenue) * 100 : 0
                    }
                }
                return {
                    categoria: d.category,
                    revenue: d.revenue,
                    cost: d.cost,
                    marginPct: Math.round(marginPct * 10) / 10,
                    marginPctPrev: Math.round(marginPctPrev * 10) / 10,
                }
            })
            setData(mapped)
            const currentYear = y || year
            setMessage(isStoreC && ['2022', '2023', '2024'].includes(currentYear) ? "Datos simulados para el plan de trabajo" : null)
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
        load(year, compareYear)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, compareYear])

    const sorted = useMemo(() => [...data].sort((a, b) => b.marginPct - a.marginPct), [data])
    const onMove = useCallback((_e: any) => {
        // placeholder for future interaction
    }, [])

    const chartConfig = {
        marginPct: { label: "Margen %", color: "hsl(var(--chart-4))" },
        marginPctPrev: { label: "Margen % Año Anterior", color: "hsl(var(--chart-5))" },
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>Margen por Categoría</CardTitle>
                        <CardDescription>Margen porcentual en el año seleccionado</CardDescription>
                    </div>
                    <ChartInfo title="Margen por Categoría">
                        <p className="text-sm">Calculado como (ingreso - costo) / ingreso para la ventana reciente.</p>
                    </ChartInfo>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm">Año</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
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
                        onChange={(e) => { const cy = e.target.value; setCompareYear(cy); load(year, cy) }}
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
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sorted} margin={{ bottom: 24 }} onMouseMove={onMove} onMouseLeave={() => { }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="categoria" angle={-20} textAnchor="end" interval={0} height={60} />
                            <YAxis domain={[0, "auto"]} />
                            <Tooltip data={sorted} content={renderTooltipWithoutRange} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={Math.max(0, sorted.length - 1)} shared={true} />
                            <Bar dataKey="marginPct" fill="hsl(var(--chart-4))" name="Margen Actual %" radius={[6, 6, 0, 0]} activeBar={{ stroke: 'hsl(var(--chart-4))', strokeWidth: 3 }} />
                            {compareYear && <Bar dataKey="marginPctPrev" fill="hsl(var(--chart-5))" name="Margen Anterior %" radius={[6, 6, 0, 0]} activeBar={{ stroke: 'hsl(var(--chart-5))', strokeWidth: 3 }} />}
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                {loading && <p className="text-sm text-muted-foreground mt-2">Cargando...</p>}
                {!loading && sorted.length === 0 && <p className="text-sm text-muted-foreground mt-2">Sin datos disponibles.</p>}
            </CardContent>
        </Card>
    )
}