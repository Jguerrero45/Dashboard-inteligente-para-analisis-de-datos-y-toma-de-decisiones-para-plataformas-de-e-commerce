"use client"

import { useState, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { AIRecommendations } from "@/components/ai-recommendations"

export default function IaRecomendacionesPage() {
    const [response, setResponse] = useState("")
    const [loading, setLoading] = useState(false)
    // Lista de recomendaciones mostradas en el panel lateral.
    // Nota: estas recomendaciones deben persistirse en la base de datos cuando exista el endpoint.
    // Guardamos localmente en estado y enviamos comentario TODO donde se necesite persistencia.
    const today = new Date().toISOString().slice(0, 10)
    const [recommendations, setRecommendations] = useState<any[]>([
        { type: 'pricing', priority: 'high', title: 'Ajuste de Precio Recomendado', description: 'El producto "Laptop Gaming X1" tiene alta demanda pero bajo margen. Considera aumentar el precio en 8% para optimizar rentabilidad.', impact: '+$2,340 mensuales estimados', icon: undefined, generatedAt: `${today}T10:00:00Z` },
    ])

    // Mock de categorías y productos (reemplazar por llamada a backend si existe)
    const categories = useMemo(() => [
        { id: 'electronics', name: 'Electrónica' },
        { id: 'fashion', name: 'Moda' },
        { id: 'home', name: 'Hogar' },
    ], [])

    const productsByCategory: Record<string, { id: string; name: string }[]> = {
        electronics: [
            { id: 'laptop_x1', name: 'Laptop Gaming X1' },
            { id: 'headphones_pro', name: 'Auriculares Bluetooth Pro' },
            { id: 'mouse_elite', name: 'Mouse Inalámbrico Elite' },
        ],
        fashion: [
            { id: 'tshirt_basic', name: 'Camiseta Básica' },
            { id: 'sneakers_run', name: 'Zapatillas Run' },
        ],
        home: [
            { id: 'blender_500', name: 'Licuadora 500W' },
            { id: 'coffee_maker', name: 'Cafetera Express' },
        ],
    }

    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id)
    const [selectedProduct, setSelectedProduct] = useState<string | "">("")

    // Nota: reemplazar esta función con llamada real a backend/IA.
    // Por ahora devuelve una respuesta corta determinística derivada del prompt
    // Genera una respuesta breve basada en la categoría y producto seleccionados.
    async function generateAutomaticRecommendations() {
        setLoading(true)
        await new Promise((r) => setTimeout(r, 700))

        const cat = categories.find((c) => c.id === selectedCategory)
        const products = productsByCategory[selectedCategory] ?? []
        const prod = products.find((p) => p.id === selectedProduct)

        const base = `Recomendaciones automáticas para ${cat?.name}${prod ? ` - ${prod.name}` : ''}`
        const details = prod
            ? `Analizar precio, inventario y rendimiento de ${prod.name}. Sugerir ajustes de precio y campañas segmentadas.`
            : `Analizar los productos en la categoría ${cat?.name}, identificar oportunidades de promoción y ajuste de inventario.`

        const generated = `${base}: ${details}`
        setResponse(generated)
        setLoading(false)
    }

    // Generación explícita usando los filtros actuales (botón 'Generar (por filtros)')
    async function generateByFilters() {
        setLoading(true)
        await new Promise((r) => setTimeout(r, 700))

        const cat = categories.find((c) => c.id === selectedCategory)
        const products = productsByCategory[selectedCategory] ?? []
        const prod = products.find((p) => p.id === selectedProduct)

        const base = `Generación por filtros para ${cat?.name}${prod ? ` - ${prod.name}` : ''}`
        const details = prod
            ? `Revisar los datos de ${prod.name} y proponer ajustes de precio/inventario y campañas específicas.`
            : `Revisar los productos en la categoría ${cat?.name} y proponer promociones y rotación de inventario.`

        const generated = `${base}: ${details}`
        setResponse(generated)
        setLoading(false)
    }

    // Guarda la respuesta actual en el panel de Recomendaciones Inteligentes (no obligatorio generar antes)
    function saveResponseToRecommendations() {
        if (!response || response.trim() === "") return

        const newRec = {
            type: 'custom',
            priority: 'low',
            title: response.slice(0, 60),
            description: response,
            impact: '',
            icon: undefined,
            generatedAt: new Date().toISOString(),
        }

        setRecommendations((prev) => [newRec, ...prev])

        // TODO: Persistir en backend: POST /api/recommendations con newRec
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
                                    <div className="flex items-start justify-between w-full">
                                        <div>
                                            <CardTitle>Filtros</CardTitle>
                                            <CardDescription>Filtra por categoría y productos (productos dependen de la categoría)</CardDescription>
                                        </div>
                                        <div>
                                            <Button onClick={generateAutomaticRecommendations} disabled={loading || !selectedCategory}>
                                                Generar recomendaciones automáticas
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <label className="flex-1">
                                                <div className="text-sm font-medium mb-1">Categoría</div>
                                                <Select value={selectedCategory} onValueChange={(v: string) => { setSelectedCategory(v); setSelectedProduct("") }}>
                                                    <SelectTrigger className="w-full text-foreground placeholder:text-muted-foreground">{categories.find((c) => c.id === selectedCategory)?.name}</SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </label>

                                            <label className="flex-1">
                                                <div className="text-sm font-medium mb-1">Productos</div>
                                                <Select value={selectedProduct === "" ? "ALL" : selectedProduct} onValueChange={(v: string) => setSelectedProduct(v === "ALL" ? "" : v)}>
                                                    <SelectTrigger className="w-full text-foreground placeholder:text-muted-foreground">{selectedProduct ? (productsByCategory[selectedCategory] ?? []).find((p) => p.id === selectedProduct)?.name : "-- Todos --"}</SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ALL">-- Todos --</SelectItem>
                                                        {(productsByCategory[selectedCategory] ?? []).map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button onClick={generateByFilters} disabled={loading || !selectedCategory}>
                                                Generar (por filtros)
                                            </Button>
                                            <Button variant="ghost" onClick={() => { setSelectedCategory(categories[0].id); setSelectedProduct(""); setResponse("") }}>
                                                Limpiar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Respuesta</CardTitle>
                                    <CardDescription>Respuesta generada basada en filtros seleccionados</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="min-h-[64px] p-3 rounded-md border bg-card space-y-3">
                                        {loading ? <span className="text-sm text-muted-foreground">Generando…</span> : (
                                            response ? <p className="text-sm">{response}</p> : <p className="text-sm text-muted-foreground">No hay respuesta. Selecciona filtros y pulsa "Generar recomendaciones automáticas".</p>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Button onClick={saveResponseToRecommendations} disabled={!response || response.trim() === ""}>
                                                Guardar respuesta
                                            </Button>
                                            <Button variant="ghost" onClick={() => setResponse("")}>Limpiar respuesta</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-1">
                            <AIRecommendations recommendations={recommendations} onRefresh={async () => {
                                // Handler de refresco: aquí podrías hacer un fetch a backend para obtener las últimas recomendaciones
                                await new Promise((r) => setTimeout(r, 400))
                                // TODO: fetch(`/api/recommendations?date=${today}`) y actualizar setRecommendations
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
