"use client"

import { useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { ProfitMarginChart } from "@/components/charts/profit-margin-chart"

export default function FinanzasPage() {
    const { currency, exchangeRate, formatPrice } = useCurrency()
    const [categoryFilter, setCategoryFilter] = useState("todas")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [sortByProfitDesc, setSortByProfitDesc] = useState(true)

    const baseRaw = [
        { category: "Electrónica", revenue: 12000, cost: 8000 },
        { category: "Ropa", revenue: 8000, cost: 5000 },
        { category: "Hogar", revenue: 6000, cost: 4000 },
        { category: "Deportes", revenue: 9000, cost: 6000 },
        { category: "Libros", revenue: 4000, cost: 2500 },
    ]

    const data = useMemo(
        () =>
            baseRaw.map((item) => {
                const revenue = currency === "VES" ? item.revenue * exchangeRate : item.revenue
                const cost = currency === "VES" ? item.cost * exchangeRate : item.cost
                const profit = revenue - cost
                const margin = revenue > 0 ? (profit / revenue) * 100 : 0
                return { ...item, revenue, cost, profit, margin }
            }),
        [currency, exchangeRate]
    )

    const categories = ["todas", ...data.map((d) => d.category)]

    const filtered = useMemo(() => {
        let items = data
        if (categoryFilter !== "todas") items = items.filter((d) => d.category === categoryFilter)
        return items.sort((a, b) => (sortByProfitDesc ? b.profit - a.profit : a.profit - b.profit))
    }, [data, categoryFilter, sortByProfitDesc])

    const totalProfit = data.reduce((s, r) => s + r.profit, 0)
    const avgMargin = data.length ? data.reduce((s, r) => s + r.margin, 0) / data.length : 0

    function exportCSV() {
        const headers = ["Categoría", "Ingresos", "Costos", "Ganancia", "Margen (%)"]
        const rows = filtered.map((r) => [
            r.category,
            r.revenue.toFixed(2),
            r.cost.toFixed(2),
            r.profit.toFixed(2),
            r.margin.toFixed(2),
        ])
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `finanzas_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
                        <p className="text-muted-foreground">Análisis monetario: ganancias, costos y margen de utilidad</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ganancia Total</CardTitle>
                                <CardDescription>Total de ganancias (ingresos - costos)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatPrice(totalProfit)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Margen Promedio</CardTitle>
                                <CardDescription>Margen de utilidad promedio por categoría</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{avgMargin.toFixed(2)}%</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Moneda Actual</CardTitle>
                                <CardDescription>Tipo de cambio aplicado (si aplica)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currency}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium">Categoría</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <label className="text-sm font-medium">Rango</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => setSortByProfitDesc((s) => !s)}>
                                Ordenar por Ganancia {sortByProfitDesc ? "(desc)" : "(asc)"}
                            </Button>
                            <Button onClick={exportCSV}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <RevenueChart />
                        <ProfitMarginChart />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle por Categoría</CardTitle>
                            <CardDescription>Listado de ingresos, costos, ganancia y margen por categoría</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Ingresos</TableHead>
                                            <TableHead>Costos</TableHead>
                                            <TableHead>Ganancia</TableHead>
                                            <TableHead>Margen</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                    No hay datos con los filtros aplicados
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filtered.map((r) => (
                                                <TableRow key={r.category}>
                                                    <TableCell className="font-medium">{r.category}</TableCell>
                                                    <TableCell>{formatPrice(r.revenue)}</TableCell>
                                                    <TableCell>{formatPrice(r.cost)}</TableCell>
                                                    <TableCell className="font-semibold">{formatPrice(r.profit)}</TableCell>
                                                    <TableCell>{r.margin.toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <DashboardFooter />
        </div>
    )
}
