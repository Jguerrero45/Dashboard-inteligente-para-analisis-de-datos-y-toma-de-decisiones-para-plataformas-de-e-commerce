"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, AlertCircle, Target } from "lucide-react"

export function AIRecommendations() {
  const recommendations = [
    {
      type: "pricing",
      priority: "high",
      title: "Ajuste de Precio Recomendado",
      description:
        'El producto "Laptop Gaming X1" tiene alta demanda pero bajo margen. Considera aumentar el precio en 8% para optimizar rentabilidad.',
      impact: "+$2,340 mensuales estimados",
      icon: TrendingUp,
    },
    {
      type: "marketing",
      priority: "medium",
      title: "Campaña Publicitaria Sugerida",
      description:
        'Los "Auriculares Bluetooth Pro" tienen ventas decrecientes (-15%). Lanza una campaña promocional para recuperar tracción.',
      impact: "Recuperación estimada: 120 unidades/mes",
      icon: Target,
    },
    {
      type: "inventory",
      priority: "high",
      title: "Alerta de Inventario",
      description:
        'El "Mouse Inalámbrico Elite" está cerca de agotarse (23 unidades). Aumenta el stock antes del fin de semana.',
      impact: "Evita pérdida de $1,850 en ventas",
      icon: AlertCircle,
    },
  ]

  // Use semantic palette variables so badges adapt to light/dark palettes
  const priorityStyles: Record<string, React.CSSProperties> = {
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

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Recomendaciones Inteligentes</CardTitle>
        </div>
        <CardDescription>
          Análisis de IA para optimizar ventas, marketing y toma de decisiones estratégicas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon
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
        })}
      </CardContent>
    </Card>
  )
}
