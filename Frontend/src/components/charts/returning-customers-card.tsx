"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"

import { getApiBase } from "@/lib/activeStore"
import { getPlanLabel } from "@/lib/plan-years"

export function ReturningCustomersCard() {
    const isStoreC = getApiBase() === '/api3'
    const rates = isStoreC ? {
        '2022': 64, // simulated
        '2023': 71, // simulated
        '2024': 79, // simulated
        '2025': 0,
        '2026': 22,
    } : {
        '2022': 76,
        '2023': 75,
        '2024': 81,
        '2025': 97,
        '2026': 30,
    }

    const [selectedYear, setSelectedYear] = useState('2026')

    const showPlanMessage = useMemo(() => {
        if (!isStoreC) return false
        return ['2022', '2023', '2024'].includes(selectedYear)
    }, [isStoreC, selectedYear])

    const currentRate = rates[selectedYear as keyof typeof rates] || 0
    const chartData = [{ name: "Clientes que regresan", value: currentRate }]

    const onMove = useCallback((_e: any) => {
        // tooltip handles interaction
    }, [])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between w-full">
                    <div>
                        <CardTitle>% de clientes que regresan</CardTitle>
                        <CardDescription>Porcentaje de clientes con más de una compra</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <ChartInfo title="Clientes que regresan">
                            <p className="text-sm">Porcentaje de clientes que han realizado más de una compra en la tienda, comparado por año.</p>
                        </ChartInfo>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="text-sm rounded-md px-2 py-1"
                            style={{
                                backgroundColor: 'hsl(var(--color-popover))',
                                color: 'hsl(var(--color-popover-foreground))',
                                borderColor: 'hsl(var(--color-border))',
                            }}
                        >
                            {Object.keys(rates).map((year) => (
                                <option key={year} value={year}>{getPlanLabel(isStoreC, year)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer config={{ value: { label: "Clientes que regresan", color: "hsl(var(--chart-2))" } }} className="h-full">
                            <RadialBarChart innerRadius="60%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270} onMouseMove={onMove} onMouseLeave={() => { }}>
                                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                <Tooltip
                                    data={chartData}
                                    content={renderTooltipWithoutRange}
                                    cursor={{ fill: 'var(--color-background)', opacity: 1 }}
                                    wrapperStyle={{ background: 'var(--color-background)', color: '#000000', opacity: 1 }}
                                    defaultIndex={0}
                                    shared={false}
                                />
                                <RadialBar dataKey="value" background fill="hsl(var(--chart-2))" name="% de clientes" />
                            </RadialBarChart>
                        </ChartContainer>
                    </ResponsiveContainer>
                </div>
                <div className="text-center space-y-1">
                    <div className="text-3xl font-bold">{currentRate}%</div>
                    <p className="text-muted-foreground text-sm">
                        {selectedYear === '2026'
                            ? `${currentRate}% de clientes regresan en 2026 debido a que el año va comenzando.`
                            : `${currentRate}% de clientes regresan en ${getPlanLabel(isStoreC, selectedYear)}.`}
                    </p>
                    {showPlanMessage && (
                        <p className="text-sm text-blue-600">Datos simulados para el plan de trabajo</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}