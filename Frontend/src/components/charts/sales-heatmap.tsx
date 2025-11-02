"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ChartInfo from "@/components/ui/chart-info"

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const hoursOfDay = ["00", "04", "08", "12", "16", "20"]

// Datos simulados de intensidad de ventas (0-100)
const heatmapData = [
  [20, 15, 45, 75, 85, 65], // Lunes
  [25, 18, 50, 80, 90, 70], // Martes
  [22, 16, 48, 78, 88, 68], // Miércoles
  [28, 20, 55, 85, 95, 75], // Jueves
  [30, 22, 58, 88, 98, 78], // Viernes
  [35, 25, 65, 92, 100, 85], // Sábado
  [32, 24, 60, 90, 95, 80], // Domingo
]

function getColorIntensity(value: number) {
  // Retornamos cadenas CSS para usar en style={{ backgroundColor }}
  if (value >= 80) return "hsl(var(--chart-1))"
  if (value >= 60) return "hsl(var(--chart-2))"
  if (value >= 40) return "hsl(var(--chart-3))"
  if (value >= 20) return "hsl(var(--chart-4))"
  return "hsl(var(--color-muted))"
}

export function SalesHeatmap() {
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
          <div className="flex gap-2">
            <div className="w-12" />
            {hoursOfDay.map((hour) => (
              <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
                {hour}h
              </div>
            ))}
          </div>
          {daysOfWeek.map((day, dayIndex) => (
            <div key={day} className="flex gap-2">
              <div className="w-12 text-xs text-muted-foreground flex items-center">{day}</div>
              {heatmapData[dayIndex].map((value, hourIndex) => (
                <div
                  key={hourIndex}
                  className={`flex-1 h-10 rounded transition-all hover:scale-105 cursor-pointer`}
                  title={`${day} ${hoursOfDay[hourIndex]}:00 - ${value}% actividad`}
                  style={{ backgroundColor: getColorIntensity(value) }}
                />
              ))}
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
