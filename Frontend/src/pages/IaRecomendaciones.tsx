import { useState, useMemo, useEffect } from "react"
import { getApiBase } from "@/lib/activeStore"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { AIRecommendations } from "@/components/ai-recommendations"

type Product = { id: number; nombre: string; categoria: string }

export default function IaRecomendacionesPage() {
    const API_BASE = getApiBase()
    const [response, setResponse] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetchingProducts, setFetchingProducts] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [lastAI, setLastAI] = useState<any | null>(null)
    // Lista de recomendaciones mostradas en el panel lateral.
    // Nota: estas recomendaciones deben persistirse en la base de datos cuando exista el endpoint.
    // Guardamos localmente en estado y enviamos comentario TODO donde se necesite persistencia.
    const [recommendations, setRecommendations] = useState<any[]>([])

    // Fetch productos reales desde backend
    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setFetchingProducts(true)
                const res = await fetch(`${API_BASE}/Productos/`)
                if (!res.ok) throw new Error(`Error ${res.status}`)
                const data = await res.json()
                if (mounted && Array.isArray(data)) {
                    const mapped: Product[] = data.map((p: any) => ({
                        id: Number(p.id),
                        nombre: p.nombre ?? String(p.id),
                        categoria: p.categoria ?? "Sin categoría",
                    }))
                    setProducts(mapped)
                }
            } catch (e) {
                // mantener silencio en UI; dejamos fallback sin productos
            } finally {
                if (mounted) setFetchingProducts(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [API_BASE])

    const categories = useMemo(() => {
        const uniq = Array.from(new Set(products.map((p) => p.categoria || "Sin categoría")))
        return uniq.map((c) => ({ id: c, name: c }))
    }, [products])

    const productsByCategory = useMemo(() => {
        const map: Record<string, { id: string; name: string }[]> = {}
        products.forEach((p) => {
            const key = p.categoria || "Sin categoría"
            if (!map[key]) map[key] = []
            map[key].push({ id: String(p.id), name: p.nombre })
        })
        return map
    }, [products])

    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [selectedProduct, setSelectedProduct] = useState<string | "">("")

    // si llegan categorías reales, escoger la primera por defecto
    useEffect(() => {
        if (!selectedCategory && categories.length > 0) setSelectedCategory(categories[0].id)
    }, [categories, selectedCategory])

    // Solicita recomendaciones al backend (Gemini). Si falla con filtros, reintenta sin filtros.
    async function requestRecommendation(useFilters: boolean, alreadyRetried = false) {
        setLoading(true)
        // Definir un límite amplio según filtros para que Gemini analice más productos
        const payload: Record<string, any> = {}

        if (useFilters) {
            const cat = categories.find((c) => c.id === selectedCategory)
            if (cat && cat.id) {
                payload.category = cat.id
                if (selectedProduct && !Number.isNaN(Number(selectedProduct))) {
                    payload.product_ids = [Number(selectedProduct)]
                    payload.limit = 1
                } else {
                    const count = (productsByCategory[selectedCategory] ?? []).length
                    payload.limit = Math.max(1, count || products.length || 20)
                }
            } else {
                // Sin categoría seleccionada: no limitar por categoría
                payload.limit = Math.max(1, products.length || 20)
            }
        } else {
            // Sin filtros: tomar todos los productos cargados
            payload.limit = Math.max(1, products.length || 20)
        }

        try {
            const res = await fetch(`${API_BASE}/ai/recommendations/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                if (useFilters && !alreadyRetried) {
                    // si falla con filtros, reintenta sin filtros
                    return await requestRecommendation(false, true)
                }
                const errText = await res.text()
                throw new Error(errText || `Error ${res.status}`)
            }

            const data = await res.json()
            const summary: string = data?.summary || ""
            setResponse(summary || "No se recibió respuesta")
            setLastAI(data)
        } catch (error: any) {
            setResponse(error?.message ? `Error: ${error.message}` : 'Error al generar recomendaciones')
        } finally {
            setLoading(false)
        }
    }

    async function generateAutomaticRecommendations() {
        if (!selectedProduct || Number.isNaN(Number(selectedProduct))) {
            setResponse('Selecciona un producto antes de generar recomendaciones.')
            return
        }
        await requestRecommendation(true)
    }

    async function generateByFilters() {
        if (!selectedProduct || Number.isNaN(Number(selectedProduct))) {
            setResponse('Selecciona un producto antes de generar recomendaciones.')
            return
        }
        await requestRecommendation(true)
    }

    // Guarda la respuesta actual en el panel de Recomendaciones Inteligentes (no obligatorio generar antes)
    async function saveResponseToRecommendations() {
        if (!response || response.trim() === "") return

        // Determinar producto a asociar: seleccionado o foco de IA
        let productoId: number | null = null
        if (selectedProduct && !Number.isNaN(Number(selectedProduct))) {
            productoId = Number(selectedProduct)
        } else if (lastAI?.card?.product_id) {
            productoId = Number(lastAI.card.product_id)
        } else if (lastAI?.debug?.best_option?.product_focus?.id) {
            productoId = Number(lastAI.debug.best_option.product_focus.id)
        }

        // Si no tenemos producto, evitamos enviar al backend (el endpoint lo requiere)
        if (!productoId) {
            setResponse("Selecciona un producto o genera una recomendación con producto antes de guardar.")
            return
        }

        // Construir payload para backend
        const productName = lastAI?.card?.product_name || lastAI?.debug?.best_option?.product_focus?.nombre || ""
        const productId = productoId ? `ID ${productoId}` : ""
        const productLabel = lastAI?.card?.product_label || (productName || productId ? `Producto: ${productName}${productName && productId ? " · " : ""}${productId}` : "Producto no identificado")

        // Usamos la descripción del card (sin duplicar summary) y dejamos el producto solo en el título
        const descripcion = (lastAI?.card?.description || response || "").trim() || "Sin descripción"
        const prioridad = lastAI?.card?.priority || 'media'
        const impacto = lastAI?.card?.impact || ''
        const metadatos = lastAI ? { ...lastAI, product_label: productLabel } : { summary: response, product_label: productLabel }

        try {
            const body: any = {
                descripcion,
                prioridad,
                impacto,
                metadatos,
            }
            body.producto = productoId

            const res = await fetch(`${API_BASE}/recomendaciones/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const t = await res.text()
                throw new Error(t || `Error ${res.status}`)
            }
            const saved = await res.json()
            // Añadir al panel con id para poder eliminar
            const newRec = {
                id: saved.id,
                type: 'custom',
                priority: prioridad === 'alta' ? 'high' : prioridad === 'baja' ? 'low' : 'medium',
                title: `${lastAI?.card?.title || 'Recomendación'} · ${productLabel}`,
                description: descripcion,
                impact: impacto,
                icon: undefined,
                generatedAt: saved.fecha || new Date().toISOString(),
            }
            // Actualizar lista local y refrescar desde backend para persistencia visible tras recarga
            setRecommendations((prev) => [newRec, ...prev])
            await loadRecommendations()
        } catch (e: any) {
            const msg = e?.message || 'No se pudo guardar la recomendación'
            setResponse(msg)
        }
    }

    // Cargar recomendaciones guardadas desde backend y mapear a UI
    async function loadRecommendations() {
        try {
            const res = await fetch(`${API_BASE}/recomendaciones/`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                const mapped = data.map((r: any) => {
                    const prioridad = (r.prioridad || 'media').toLowerCase()
                    const priority = prioridad === 'alta' ? 'high' : prioridad === 'baja' ? 'low' : 'medium'
                    const meta = r.metadatos || {}
                    const cardTitle = meta?.card?.title || 'Recomendación'
                    const productLabel = meta?.product_label || ''
                    const title = `${cardTitle}${productLabel ? ` · ${productLabel}` : ''}`
                    return {
                        id: r.id,
                        type: 'custom',
                        priority,
                        title,
                        description: r.descripcion || '',
                        impact: r.impacto || '',
                        icon: undefined,
                        generatedAt: r.fecha || new Date().toISOString(),
                    }
                })
                setRecommendations(mapped)
            }
        } catch (e) {
            // silencioso: si falla, se mantiene la lista actual
        } finally {
            // no-op
        }
    }

    // Cargar al montar la página
    useEffect(() => {
        loadRecommendations()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_BASE])

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
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <label className="flex-1">
                                                <div className="text-sm font-medium mb-1">Categoría</div>
                                                <Select value={selectedCategory} onValueChange={(v: string) => { setSelectedCategory(v); setSelectedProduct("") }}>
                                                    <SelectTrigger className="w-full text-foreground placeholder:text-muted-foreground">{categories.find((c) => c.id === selectedCategory)?.name || (fetchingProducts ? "Cargando..." : "-- Sin datos --")}</SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </label>

                                            <label className="flex-1">
                                                <div className="text-sm font-medium mb-1">Productos</div>
                                                <Select value={selectedProduct} onValueChange={(v: string) => setSelectedProduct(v)}>
                                                    <SelectTrigger className="w-full text-foreground placeholder:text-muted-foreground">{selectedProduct ? (productsByCategory[selectedCategory] ?? []).find((p) => p.id === selectedProduct)?.name : (fetchingProducts ? "Cargando..." : "-- Sin datos --")}</SelectTrigger>
                                                    <SelectContent>
                                                        {(productsByCategory[selectedCategory] ?? []).map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </label>
                                        </div>

                                        {/* Mensajes de ayuda cuando no hay productos */}
                                        {products.length === 0 && !fetchingProducts && (
                                            <p className="text-sm text-muted-foreground">No hay productos cargados. Agrega al menos un producto para que las recomendaciones funcionen.</p>
                                        )}
                                        {products.length > 0 && (productsByCategory[selectedCategory] ?? []).length === 0 && !fetchingProducts && (
                                            <p className="text-sm text-muted-foreground">Esta categoría no tiene productos. Agrega productos a la categoría para obtener recomendaciones.</p>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Button onClick={generateByFilters} disabled={loading || !selectedProduct}>
                                                Generar
                                            </Button>
                                            <Button variant="ghost" onClick={() => { setSelectedCategory(categories[0]?.id || ""); setSelectedProduct(""); setResponse("") }}>
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
                                await loadRecommendations()
                                return
                            }} onDelete={async (id: number) => {
                                try {
                                    const res = await fetch(`${API_BASE}/recomendaciones/${id}/`, { method: 'DELETE' })
                                    if (!res.ok) throw new Error(`Error ${res.status}`)
                                    setRecommendations((prev) => prev.filter((r: any) => r.id !== id))
                                } catch (e) {
                                    // opcional: mostrar toast
                                }
                            }} />
                        </div>
                    </div>
                </div>
            </main>

            <DashboardFooter />
        </div>
    )
}
