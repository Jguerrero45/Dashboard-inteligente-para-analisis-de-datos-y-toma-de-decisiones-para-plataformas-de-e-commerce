"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ChartInfo from "@/components/ui/chart-info"
import { useEffect, useState } from "react"
import { useCurrency } from "@/hooks/use-currency"
import { format, subMonths } from 'date-fns'

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

// Default (fallback) datos de intensidad de ventas (0-100) y días (0 = vacío)
const defaultHeatmap = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => 0))
const defaultDayNums = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => 0))

function getColorIntensity(value: number) {
  // Retornamos cadenas CSS para usar en style={{ backgroundColor }}
  if (value >= 80) return "hsl(var(--chart-1))"
  if (value >= 60) return "hsl(var(--chart-2))"
  if (value >= 40) return "hsl(var(--chart-3))"
  if (value >= 20) return "hsl(var(--chart-4))"
  return "hsl(var(--color-muted))"
}

export function SalesHeatmap() {
  // default: current month
  const today = new Date()
  const defaultMonth = format(today, 'yyyy-MM')
  const [month, setMonth] = useState<string>(defaultMonth)
  const [heatmapData, setHeatmapData] = useState<number[][]>(defaultHeatmap)
  const [dayNumbers, setDayNumbers] = useState<number[][]>(defaultDayNums)
  const [revenueRaw, setRevenueRaw] = useState<number[][]>(defaultDayNums)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHeatmap = (m?: string) => {
    setLoading(true)
    setError(null)
    let mounted = true
    const params = new URLSearchParams()
    if (m) params.set('month', m)
    fetch('/api/metrics/sales-heatmap/?' + params.toString())
      .then((r) => {
        if (!r.ok) throw new Error('Error fetching heatmap')
        return r.json()
      })
      .then((json) => {
        if (!mounted) return
        if (json && Array.isArray(json.heatmap) && Array.isArray(json.day_numbers)) {
          setHeatmapData(json.heatmap.map((row: any) => (Array.isArray(row) ? row.map((v: any) => Number(v || 0)) : Array.from({ length: 7 }, () => 0))))
          setDayNumbers(json.day_numbers.map((row: any) => (Array.isArray(row) ? row.map((v: any) => Number(v || 0)) : Array.from({ length: 7 }, () => 0))))
          if (Array.isArray(json.revenue_raw)) {
            setRevenueRaw(json.revenue_raw.map((row: any) => (Array.isArray(row) ? row.map((v: any) => Number(v || 0)) : Array.from({ length: 7 }, () => 0))))
          } else {
            setRevenueRaw(defaultDayNums)
          }
        } else {
          setHeatmapData(defaultHeatmap)
          setDayNumbers(defaultDayNums)
          setRevenueRaw(defaultDayNums)
        }
      })
      .catch((err) => { setError(String(err)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }

  useEffect(() => {
    // initial load with default month
    loadHeatmap(month)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { formatPrice } = useCurrency()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Mapa de Calor de Ventas</CardTitle>
            <CardDescription>Intensidad de ventas por día y hora</CardDescription>
          </div>
          <ChartInfo title="Mapa de Calor de Ventas">
            <p className="text-sm">Mapa que muestra la intensidad relativa de ventas por día y franja horaria (mayor intensidad = más ventas).</p>
          </ChartInfo>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Month filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm">Mes</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-2 py-1">
              {Array.from({ length: 12 }).map((_, i) => {
                const d = subMonths(new Date(), i)
                const key = format(d, 'yyyy-MM')
                const label = format(d, 'MMM yyyy')
                return <option key={key} value={key}>{label}</option>
              })}
            </select>
            <button onClick={() => loadHeatmap(month)} className="ml-2 rounded border px-3 py-1">Aplicar</button>
            <button onClick={() => { const m = format(new Date(), 'yyyy-MM'); setMonth(m); loadHeatmap(m); }} className="ml-2 rounded border px-3 py-1">Reset</button>
            {loading ? <span className="ml-2 text-sm">Cargando...</span> : null}
            {error ? <span className="ml-2 text-sm text-destructive">{error}</span> : null}
          </div>

          {/* Calendar header: weekdays */}
          <div className="flex gap-2 mt-2">
            <div className="w-12" />
            {daysOfWeek.map((hour) => (
              <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
                {hour}
              </div>
            ))}
          </div>

          {/* Calendar rows (weeks) */}
          {heatmapData.map((row, weekIndex) => (
            <div key={weekIndex} className="flex gap-2">
              <div className="w-12 text-xs text-muted-foreground flex items-center">{`S${weekIndex + 1}`}</div>
              {row.map((value, colIndex) => {
                const dayNum = (dayNumbers && dayNumbers[weekIndex] && dayNumbers[weekIndex][colIndex]) || 0
                return (
                  <div
                    key={colIndex}
                    className={`flex-1 h-10 rounded relative transition-all hover:scale-105 cursor-pointer`}
                    title={dayNum ? `${dayNum} ${daysOfWeek[colIndex]} - ${value}% actividad${revenueRaw && revenueRaw[weekIndex] ? ` (${formatPrice(revenueRaw[weekIndex][colIndex] || 0)})` : ''}` : `Sin día`}
                    style={{ backgroundColor: getColorIntensity(value) }}
                  >
                    {dayNum ? <span className="absolute left-1 top-1 text-[10px] text-muted-foreground">{dayNum}</span> : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Menos actividad</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--color-muted))" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
          </div>
          <span>Más actividad</span>
        </div>
      </CardContent>
    </Card>
  )
}
