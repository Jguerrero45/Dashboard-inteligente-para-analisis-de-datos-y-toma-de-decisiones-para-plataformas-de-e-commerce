"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, AlertCircle, Target, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AIRecommendations({ recommendations: propRecommendations, onRefresh, onDelete }: { recommendations?: any[]; onRefresh?: () => Promise<void>; onDelete?: (id: number) => Promise<void> }) {
  const today = new Date().toISOString().slice(0, 10)

  const [filterDate, setFilterDate] = useState(today)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 2

  // Use recommendations passed from parent; default to empty list
  const recommendations = propRecommendations ?? []

  const filtered = useMemo(() => {
    return recommendations.filter((r) => (r.generatedAt || "").slice(0, 10) === filterDate)
  }, [recommendations, filterDate])

  // Resetear a la primera página cuando cambie el filtro o el listado
  useEffect(() => {
    setPage(0)
  }, [filterDate, recommendations])

  // Paginación: 2 por página. Página 0 = primeras 2; posteriores = siguientes sin las 2 primeras.
  const totalPages = Math.ceil(filtered.length / pageSize)
  const safePage = Math.min(Math.max(page, 0), Math.max(totalPages - 1, 0))
  const start = safePage * pageSize
  const currentItems = filtered.slice(start, start + pageSize)

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
          <Button onClick={handleRefresh} variant="outline" className="border-blue-400 text-blue-600 hover:bg-blue-50">
            <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
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
          <>
            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  disabled={safePage === 0}
                >
                  ◀
                </Button>
                <span className="text-xs text-muted-foreground">
                  {safePage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, Math.max(totalPages - 1, 0)))}
                  disabled={safePage >= totalPages - 1}
                >
                  ▶
                </Button>
              </div>
            )}

            {/* Página actual (2 ítems por página) */}
            {currentItems.map((rec, index) => {
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
                    {rec.impact ? (
                      <p className="text-sm font-medium text-primary">
                        Beneficio: {rec.impact}
                      </p>
                    ) : null}
                    {onDelete && typeof rec.id === 'number' ? (
                      <div className="pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const ok = window.confirm("¿Eliminar esta recomendación? Esta acción no se puede deshacer.")
                            if (!ok) return
                            onDelete(rec.id)
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </CardContent>
    </Card>
  )
}
