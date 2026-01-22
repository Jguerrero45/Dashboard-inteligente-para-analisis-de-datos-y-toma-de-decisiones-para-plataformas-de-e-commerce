"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, Tooltip, renderTooltipWithoutRange } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"
import { useEffect, useState, useCallback } from "react"

// initial empty data; will be fetched from backend

export function TopProductsChart() {
  const { formatPrice } = useCurrency()
  const [topProductsData, setTopProductsData] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<'units' | 'revenue'>('units')

  useEffect(() => {
    let mounted = true
    fetch(`/api/metrics/top-products/?limit=5&sort=${sortBy}`)
      .then((r) => r.json())
      .then((json) => {
        if (mounted && Array.isArray(json)) setTopProductsData(json)
      })
      .catch(() => { })
    return () => {
      mounted = false
    }
  }, [sortBy])

  // Handler para cambiar criterio de orden
  const handleSortChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const v = evt.target.value as 'units' | 'revenue'
    setSortBy(v)
  }

  // Usar valores crudos desde el backend y delegar formateo a `formatPrice`
  const chartData = topProductsData.map((p) => ({ ...p }))
  const onMove = useCallback((_e: any) => {
    // placeholder
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top 5 productos por ingresos generados</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <ChartInfo title="Productos Más Vendidos">
              <p className="text-sm">Lista de los productos que generaron más ingresos en el periodo seleccionado.</p>
            </ChartInfo>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="text-sm rounded-md px-2 py-1"
              style={{
                backgroundColor: 'hsl(var(--color-popover))',
                color: 'hsl(var(--color-popover-foreground))',
                borderColor: 'hsl(var(--color-border))',
              }}
            >
              <option value="units">Unidades</option>
              <option value="revenue">Ingresos</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            ventas: {
              label: "Ventas",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" onMouseMove={onMove} onMouseLeave={() => { }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="producto" type="category" width={100} />
              <Tooltip data={chartData} content={renderTooltipWithoutRange} formatter={(value: number) => formatPrice(value)} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2 }} defaultIndex={0} shared={false} />
              <Bar dataKey="ventas" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} name="Ventas" activeBar={{ stroke: 'hsl(var(--chart-1))', strokeWidth: 3 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
