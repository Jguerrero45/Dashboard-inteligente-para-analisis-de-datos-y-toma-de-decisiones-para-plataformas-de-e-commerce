"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import {
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Target,
  ShoppingCart,
  Users,
  DollarSign,
} from "lucide-react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  // Página de predicciones eliminada. Se mantiene archivo stub para compatibilidad.
  export default function PrediccionesPage() {
    return null
  }
<CardContent>
  <ChartContainer
    config={{
      actual: {
        label: "Rendimiento Actual",
        color: "hsl(var(--chart-3))",
      },
      predicho: {
        label: "Rendimiento Predicho",
        color: "hsl(var(--chart-4))",
      },
    }}
    className="h-[350px]"
  >
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={categoryPerformanceData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="categoria" />
        <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
        <Radar
          name="Rendimiento Actual"
          dataKey="actual"
          stroke="hsl(var(--chart-3))"
          fill="hsl(var(--chart-3))"
          fillOpacity={0.6}
        />
        {hasPredCategory && (
          <Radar
            name="Rendimiento Predicho"
            dataKey="predicho"
            stroke="hsl(var(--chart-4))"
            fill="hsl(var(--chart-4))"
            fillOpacity={0.3}
          />
        )}
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  </ChartContainer>
  {/* Resumen numérico exacto debajo del radar de rendimiento por categoría */}
  <div className="mt-4 space-y-2">
    {categoryPerformanceData.map((c) => (
      <div key={c.categoria} className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{c.categoria}</span>
        <span className="font-medium">
          Actual: {formatPrice(c.actual)}
          {hasPredCategory && c.predicho !== null && <> · Predicho: {formatPrice(c.predicho as number)}</>}
        </span>
      </div>
    ))}
  </div>
</CardContent>
          </Card >

  {/* Las gráficas de 'Predicción de Abandono de Clientes' y 'Optimización de Precios' han sido removidas. */ }
        </div >
      </main >

  <DashboardFooter />
    </div >
  )
}

