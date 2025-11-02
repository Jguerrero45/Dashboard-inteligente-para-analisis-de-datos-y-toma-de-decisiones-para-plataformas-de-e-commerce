"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AIRecommendations } from "@/components/ai-recommendations"

export default function IaRecomendacionesPage() {
    const [prompt, setPrompt] = useState("")
    const [response, setResponse] = useState("")
    const [loading, setLoading] = useState(false)
    // Lista de recomendaciones mostradas en el panel lateral.
    // Nota: estas recomendaciones deben persistirse en la base de datos cuando exista el endpoint.
    // Guardamos localmente en estado y enviamos comentario TODO donde se necesite persistencia.
    const today = new Date().toISOString().slice(0, 10)
    const [recommendations, setRecommendations] = useState<any[]>([
        { type: 'pricing', priority: 'high', title: 'Ajuste de Precio Recomendado', description: 'El producto "Laptop Gaming X1" tiene alta demanda pero bajo margen. Considera aumentar el precio en 8% para optimizar rentabilidad.', impact: '+$2,340 mensuales estimados', icon: undefined, generatedAt: `${today}T10:00:00Z` },
    ])

    // Nota: reemplazar esta función con llamada real a backend/IA.
    // Por ahora devuelve una respuesta corta determinística derivada del prompt
    async function generateShortResponse(p: string) {
        setLoading(true)
        // Simular latencia
        await new Promise((r) => setTimeout(r, 600))
        const trimmed = p.trim()
        const short = trimmed.length === 0 ? "" : trimmed.split(" ").slice(0, 8).join(" ")
        const generated = short ? `${short}${trimmed.length > short.length ? '…' : ''}` : ""
        setResponse(generated)

        // Crear objeto de recomendación y guardarlo en el panel de Recomendaciones Inteligentes
        const newRec = {
            type: 'custom',
            priority: 'low',
            title: generated || 'Respuesta IA',
            description: generated || 'Respuesta generada',
            impact: '',
            icon: undefined,
            generatedAt: new Date().toISOString(),
        }

        // Guardar en estado local para que aparezca inmediatamente en el panel
        setRecommendations((prev) => [newRec, ...prev])

        // TODO: Persistir esta recomendación en la base de datos mediante POST a /api/recommendations
        // Ejemplo (pendiente de implementar en backend):
        // await fetch('/api/recommendations', { method: 'POST', body: JSON.stringify(newRec) })

        setLoading(false)
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Recomendaciones IA</h1>
                        <p className="text-muted-foreground">Interactúa con el motor de recomendaciones. Escribe un prompt y obtén una respuesta corta.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prompt</CardTitle>
                                    <CardDescription>Escribe una petición breve para la IA</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3">
                                        <Input value={prompt} onChange={(e: any) => setPrompt(e.target.value)} placeholder="Escribe tu prompt aquí..." />
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => generateShortResponse(prompt)} disabled={loading || prompt.trim() === ""}>
                                                Generar
                                            </Button>
                                            <Button variant="ghost" onClick={() => { setPrompt(""); setResponse("") }}>
                                                Limpiar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Respuesta</CardTitle>
                                    <CardDescription>Respuesta corta generada por la IA</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="min-h-[64px] p-3 rounded-md border bg-card">
                                        {loading ? <span className="text-sm text-muted-foreground">Generando…</span> : (
                                            response ? <p className="text-sm">{response}</p> : <p className="text-sm text-muted-foreground">No hay respuesta. Escribe un prompt y pulsa Generar.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-1">
                            <AIRecommendations recommendations={recommendations} onRefresh={async () => {
                                // Handler de refresco: aquí podrías hacer un fetch a backend para obtener las últimas recomendaciones
                                // Por ahora simulamos una recarga (sin cambios)
                                await new Promise((r) => setTimeout(r, 400))
                                // TODO: fetch(`/api/recommendations?date=${selectedDate}`) y actualizar setRecommendations
                                return
                            }} />
                        </div>
                    </div>
                </div>
            </main>

            <DashboardFooter />
        </div>
    )
}
