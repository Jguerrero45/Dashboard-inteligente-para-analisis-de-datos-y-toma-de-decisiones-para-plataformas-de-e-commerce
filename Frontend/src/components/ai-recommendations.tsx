"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, AlertCircle, Target, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AIRecommendations({ recommendations: propRecommendations, onRefresh }: { recommendations?: any[]; onRefresh?: () => Promise<void> }) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Fallback initial recommendations (used only if parent doesn't provide data)
  const initial = [
    {
      type: "pricing",
      priority: "high",
      title: "Ajuste de Precio Recomendado",
      description:
        'El producto "Laptop Gaming X1" tiene alta demanda pero bajo margen. Considera aumentar el precio en 8% para optimizar rentabilidad.',
      impact: "+$2,340 mensuales estimados",
      icon: TrendingUp,
      generatedAt: `${today}T10:00:00Z`,
    },
    {
      type: "marketing",
      priority: "medium",
      title: "Campaña Publicitaria Sugerida",
      description:
        'Los "Auriculares Bluetooth Pro" tienen ventas decrecientes (-15%). Lanza una campaña promocional para recuperar tracción.',
      impact: "Recuperación estimada: 120 unidades/mes",
      icon: Target,
      generatedAt: `${yesterday}T12:00:00Z`,
    },
    {
      type: "inventory",
      priority: "high",
      title: "Alerta de Inventario",
      description:
        'El "Mouse Inalámbrico Elite" está cerca de agotarse (23 unidades). Aumenta el stock antes del fin de semana.',
      impact: "Evita pérdida de $1,850 en ventas",
      icon: AlertCircle,
      generatedAt: `${today}T08:30:00Z`,
    },
  ]

  const [filterDate, setFilterDate] = useState(today)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Use recommendations passed from parent when available, otherwise fallback to initial
  const recommendations = propRecommendations ?? initial

  const filtered = useMemo(() => {
    return recommendations.filter((r) => r.generatedAt.slice(0, 10) === filterDate)
  }, [recommendations, filterDate])

  const priorityStyles: Record<string, any> = {
    high: {
      background: "hsl(var(--color-negative) / 0.12)",
      color: "hsl(var(--color-negative))",
      borderColor: "hsl(var(--color-negative) / 0.18)",
    },
    medium: {
      background: "hsl(var(--color-neutral) / 0.12)",
      color: "hsl(var(--color-neutral))",
      borderColor: "hsl(var(--color-neutral) / 0.18)",
    },
    low: {
      background: "hsl(var(--color-primary) / 0.08)",
      color: "hsl(var(--color-primary))",
      borderColor: "hsl(var(--color-primary) / 0.12)",
    },
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    if (onRefresh) {
      // Delegate to parent to refresh recommendations (e.g., fetch from backend)
      await onRefresh()
    } else {
      // Simular petición a backend si no hay handler
      await new Promise((r) => setTimeout(r, 500))
    }
    setIsRefreshing(false)
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Recomendaciones Inteligentes</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={filterDate} onChange={(e: any) => setFilterDate(e.target.value)} />
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {isRefreshing ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>
        <CardDescription>
          Análisis de IA para optimizar ventas, marketing y toma de decisiones estratégicas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No hay recomendaciones para la fecha seleccionada.</div>
        ) : (
          filtered.map((rec, index) => {
            const Icon = rec.icon ?? Sparkles
            return (
              <div key={index} className="flex gap-4 p-4 rounded-lg border bg-card">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold leading-tight">{rec.title}</h4>
                    <Badge variant="outline" style={priorityStyles[rec.priority]}>
                      {rec.priority === "high" ? "Alta" : rec.priority === "medium" ? "Media" : "Baja"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <p className="text-sm font-medium text-primary">{rec.impact}</p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
