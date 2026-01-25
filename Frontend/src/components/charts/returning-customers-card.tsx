"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { Button } from "@/components/ui/button"
import { format, subMonths } from "date-fns"

interface ReturningRate {
    rate: number
    total_buyers: number
    returning_buyers: number
    days: number
}

export function ReturningCustomersCard() {
    const [rate, setRate] = useState<ReturningRate | null>(null)
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
    const [error, setError] = useState<string | null>(null)

    const load = async (m?: string) => {
        setLoading(true)
        setError(null)
        let mounted = true
        try {
            const params = new URLSearchParams({ days: '90' })
            if (m) params.set('month', m)
            const res = await fetch(`/api/metrics/returning-customers-rate/?${params.toString()}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            if (!mounted) return
            if (data && typeof data.rate === "number") {
                setRate({
                    rate: Math.round(data.rate * 10) / 10,
                    total_buyers: data.total_buyers ?? 0,
                    returning_buyers: data.returning_buyers ?? 0,
                    days: data.days ?? 90,
                })
            } else {
                setRate(null)
            }
        } catch (err: any) {
            if (mounted) {
                setRate(null)
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

    const chartData = rate ? [{ name: "Recompra", value: rate.rate }] : [{ name: "Recompra", value: 0 }]
    const onMove = useCallback((_e: any) => {
        // tooltip handles interaction
    }, [])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>% de clientes que vuelven</CardTitle>
                        <CardDescription>Tasa de recompra en los últimos 90 días</CardDescription>
                    </div>
                    <ChartInfo title="Clientes que vuelven">
                        <p className="text-sm">Porcentaje de compradores que realizaron al menos una recompra en la ventana seleccionada.</p>
                    </ChartInfo>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
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
                            const label = format(d, 'MMM yyyy')
                            return <option key={key} value={key}>{label}</option>
                        })}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => load(month)}>Aplicar</Button>
                    <Button variant="outline" size="sm" onClick={() => { const m = format(new Date(), 'yyyy-MM'); setMonth(m); load(m); }}>Reset</Button>
                    {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
                    {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
                </div>
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer config={{ value: { label: "Recompra", color: "hsl(var(--chart-2))" } }} className="h-full">
                            <RadialBarChart innerRadius="60%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270} onMouseMove={onMove} onMouseLeave={() => { }}>
                                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                <Tooltip data={chartData} content={renderTooltipWithoutRange} cursor={{}} defaultIndex={0} shared={false} />
                                <RadialBar dataKey="value" background fill="hsl(var(--chart-2))" />
                            </RadialBarChart>
                        </ChartContainer>
                    </ResponsiveContainer>
                </div>
                {loading ? (
                    <p className="text-muted-foreground text-sm">Cargando...</p>
                ) : rate ? (
                    <div className="text-center space-y-1">
                        <div className="text-3xl font-bold">{rate.rate}%</div>
                        <p className="text-muted-foreground text-sm">
                            {rate.returning_buyers} de {rate.total_buyers} compradores repiten en {rate.days} días.
                        </p>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">Sin datos suficientes.</p>
                )}
            </CardContent>
        </Card>
    )
}
