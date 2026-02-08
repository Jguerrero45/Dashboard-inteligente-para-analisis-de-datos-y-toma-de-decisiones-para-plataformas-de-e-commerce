"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, Search, Pencil, AlertCircle, Check, X } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { getApiBase } from "@/lib/activeStore"

export default function Costos() {
    const { formatPrice } = useCurrency()
    const API_BASE = getApiBase()
    const navigate = useNavigate()
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined
    const [productos, setProductos] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [importErrors, setImportErrors] = useState<string[] | null>(null)
    const [fileInputKey, setFileInputKey] = useState(0)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(0)
    const pageSize = 10
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingValue, setEditingValue] = useState<string>("")

    useEffect(() => {
        const userGroups = JSON.parse(localStorage.getItem('user_groups') || '[]')
        if (userGroups.includes('Empleado')) {
            navigate('/modulos')
        }
    }, [navigate])

    async function fetchProductos() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE}/Productos/`)
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                throw new Error(d.detail || 'Error al cargar productos')
            }
            const data = await res.json()
            const normalized = data.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                categoria: p.categoria,
                precio: parseFloat(p.precio) || 0,
                costo: p.costo != null ? Number(p.costo) : null,
                stock: Number(p.stock) || 0,
            }))
            setProductos(normalized)
        } catch (e: any) {
            setError(String(e?.message || e))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchProductos() }, [])

    function handleExportPlantilla() {
        if (!confirm('¿Estás seguro que deseas exportar la plantilla de costos?')) return
        const a = document.createElement('a')
        a.href = '/api/productos/costos/exportar-plantilla/'
        a.download = 'plantilla_costos.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
    }

    async function handleImportCSV(file: File) {
        if (!confirm(`¿Estás seguro que deseas importar el archivo ${file.name}? Esta acción puede sobrescribir costos existentes.`)) return
        setIsImporting(true)
        setImportErrors(null)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch(`${API_BASE}/productos/costos/importar/`, { method: 'POST', body: fd, headers: authHeaders })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.detail || 'Error al importar costos')
            }
            if (Array.isArray(data.errors) && data.errors.length > 0) {
                setImportErrors(data.errors)
            }
            await fetchProductos()
        } catch (e: any) {
            setImportErrors([String(e?.message || e)])
        } finally {
            setIsImporting(false)
            setFileInputKey((k) => k + 1)
        }
    }

    async function handleEditarCosto(productoId: number, current: number | null) {
        // Confirmar intención de editar
        if (!confirm('¿Estás seguro que deseas editar el costo de este producto?')) return
        // Activar modo edición inline en la fila
        setEditingId(productoId)
        setEditingValue(current != null ? String(current) : "")
    }

    async function saveCosto(productoId: number) {
        const raw = (editingValue || "").trim()
        // Permitir limpiar enviando null si está vacío
        const payload = raw === "" ? { costo: null } : { costo: Number(raw.replace(',', '.')) }
        if (payload.costo !== null && Number.isNaN(payload.costo)) {
            alert('Valor inválido: use punto decimal (ej: 12.34)')
            return
        }
        // Validación: el costo no puede ser 0 ni negativo
        if (payload.costo !== null && payload.costo <= 0) {
            alert('El costo debe ser un número positivo mayor que 0')
            return
        }
        // Confirmar guardado
        if (!confirm('¿Estás seguro que deseas guardar el cambio de costo?')) return
        try {
            const headers = authHeaders ? { 'Content-Type': 'application/json', ...authHeaders } : { 'Content-Type': 'application/json' }
            const res = await fetch(`/api/Productos/${productoId}/`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            })
            const d = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(d.detail || 'No se pudo actualizar el costo')
            }
            // Actualización optimista en la tabla
            setProductos((prev) => prev.map(p => p.id === productoId ? { ...p, costo: payload.costo } : p))
            setEditingId(null)
            setEditingValue("")
        } catch (e: any) {
            alert(String(e?.message || e))
        }
    }

    function cancelEdit() {
        setEditingId(null)
        setEditingValue("")
    }

    const filtrados = productos.filter(p => {
        const term = search.toLowerCase()
        return p.nombre.toLowerCase().includes(term) || String(p.id).includes(term)
    })
    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize))
    const pageItems = filtrados.slice(page * pageSize, (page + 1) * pageSize)

    useEffect(() => { setPage(0) }, [search])

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <DashboardHeader />
            <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Gestión de Costos</h1>
                        <p className="text-muted-foreground">Exporta plantilla, importa costos o edítalos individualmente</p>
                    </div>

                    {/* Advertencia de formato/moneda */}
                    <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3">
                        <AlertCircle className="h-5 w-5" style={{ color: 'hsl(var(--color-negative))' }} />
                        <div className="text-sm">
                            Ingrese el costo en dólares (USD) o precio referencial. Use punto como separador decimal (ej: 12.50).
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones</CardTitle>
                            <CardDescription>Administración de costos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={handleExportPlantilla}>
                                        <Download className="mr-2 h-4 w-4" /> Exportar Plantilla Costos
                                    </Button>
                                    <label className="inline-flex items-center">
                                        <input
                                            key={fileInputKey}
                                            type="file"
                                            accept=".csv,text/csv"
                                            className="hidden"
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportCSV(f) }}
                                        />
                                        <Button variant="outline" disabled={isImporting} onClick={() => {
                                            const input = document.querySelector('input[type=file]') as HTMLInputElement | null
                                            input?.click()
                                        }}>
                                            <Upload className="mr-2 h-4 w-4" /> {isImporting ? 'Importando...' : 'Importar Costos'}
                                        </Button>
                                    </label>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input placeholder="Buscar por nombre o ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                                </div>
                            </div>
                            {importErrors && importErrors.length > 0 && (
                                <div className="mt-3 text-xs text-muted-foreground">
                                    {importErrors.slice(0, 5).map((e, i) => (<div key={i}>• {e}</div>))}
                                    {importErrors.length > 5 ? <div>... y {importErrors.length - 5} más</div> : null}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            {loading ? <CardTitle>Cargando...</CardTitle> : error ? <CardTitle className="text-destructive">{error}</CardTitle> : <CardTitle>Listado de Productos ({filtrados.length})</CardTitle>}
                            <CardDescription>Edición 1x1 del costo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between px-1 py-2">
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} variant="outline">←</Button>
                                    <span className="text-sm">Página {page + 1} / {totalPages}</span>
                                    <Button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} variant="outline">→</Button>
                                </div>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Precio</TableHead>
                                            <TableHead>Costo (USD)</TableHead>
                                            <TableHead>Margen</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageItems.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No hay datos</TableCell></TableRow>
                                        ) : (
                                            pageItems.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium">{p.id}</TableCell>
                                                    <TableCell>{p.nombre}</TableCell>
                                                    <TableCell>{p.categoria}</TableCell>
                                                    <TableCell className="font-semibold">{formatPrice(p.precio)}</TableCell>
                                                    <TableCell>
                                                        {editingId === p.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    value={editingValue}
                                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                                    placeholder="ej: 12.50"
                                                                    className="w-32"
                                                                />
                                                            </div>
                                                        ) : (
                                                            p.costo != null ? formatPrice(p.costo) : <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingId === p.id ? (
                                                            (() => {
                                                                const raw = (editingValue || "").trim()
                                                                const val = raw === "" ? null : Number(raw.replace(',', '.'))
                                                                return val != null && !Number.isNaN(val)
                                                                    ? formatPrice(p.precio - val)
                                                                    : <span className="text-muted-foreground">—</span>
                                                            })()
                                                        ) : (
                                                            p.costo != null ? formatPrice(p.precio - p.costo) : <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingId === p.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Button variant="secondary" size="sm" onClick={() => saveCosto(p.id)}>
                                                                    <Check className="mr-2 h-4 w-4" /> Guardar
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={cancelEdit}>
                                                                    <X className="mr-2 h-4 w-4" /> Cancelar
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button variant="outline" size="sm" onClick={() => handleEditarCosto(p.id, p.costo ?? null)}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Editar Costo
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <DashboardFooter />
        </div>
    )
}
