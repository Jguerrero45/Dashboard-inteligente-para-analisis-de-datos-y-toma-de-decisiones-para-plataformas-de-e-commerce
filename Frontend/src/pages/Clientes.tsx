"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, CalendarIcon, Users } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"

// Estado local: será llenado desde la API
const clientesData: Array<any> = []

export default function ClientesPage() {
    const { formatPrice } = useCurrency()
    const [searchTerm, setSearchTerm] = useState("")
    const [segmentoFilter, setSegmentoFilter] = useState("todos")
    const [estadoFilter, setEstadoFilter] = useState("todos")
    const [dateFrom, setDateFrom] = useState<Date>()
    const [dateTo, setDateTo] = useState<Date>()
    const [clientes, setClientes] = useState<any[]>(clientesData)
    const [loading, setLoading] = useState(false)
    const [errorLoad, setErrorLoad] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        fetch('/api/Clientes/')
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.detail || 'Error al cargar clientes')
                }
                return res.json()
            })
            .then((data) => {
                // Convertir fecha_registro a Date y normalizar campos
                const normalized = data.map((c: any) => ({
                    // origId: id real en BD (estable para key)
                    origId: c.id,
                    // id: conservar la propiedad id por compatibilidad (no usada como key)
                    id: c.id,
                    // displayId: id persistente definido en backend (ej: 1000+)
                    displayId: c.display_id || c.id,
                    nombre: c.nombre,
                    email: c.email,
                    telefono: c.telefono || '',
                    fechaRegistro: c.fecha_registro ? new Date(c.fecha_registro) : null,
                    compras: c.compras || 0,
                    gastoTotal: parseFloat(c.gasto_total) || 0,
                    segmento: c.segmento || c.tipo_cliente || 'N/A',
                    estado: c.estado || 'inactivo',
                }))
                setClientes(normalized)
            })
            .catch((err) => {
                console.error('Error cargando clientes', err)
                setErrorLoad(String(err))
            })
            .finally(() => setLoading(false))
    }, [])

    // Filtrar clientes
    const clientesFiltrados = clientes.filter((c) => {
        const idStr = String(c.displayId || c.origId || '')
        const nombreStr = String(c.nombre || '')
        const emailStr = String(c.email || '')
        const matchSearch =
            idStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nombreStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emailStr.toLowerCase().includes(searchTerm.toLowerCase())
        const matchSegmento = segmentoFilter === "todos" || c.segmento === segmentoFilter
        const matchEstado = estadoFilter === "todos" || c.estado === estadoFilter
        const matchDateFrom = !dateFrom || c.fechaRegistro >= dateFrom
        const matchDateTo = !dateTo || c.fechaRegistro <= dateTo
        return matchSearch && matchSegmento && matchEstado && matchDateFrom && matchDateTo
    })

    // Estadísticas
    const totalClientes = clientesFiltrados.length
    const clientesActivos = clientesFiltrados.filter((c) => c.estado === "activo").length
    const gastoTotal = clientesFiltrados.reduce((sum, c) => sum + (Number(c.gastoTotal) || 0), 0)
    const gastoPromedio = totalClientes > 0 ? gastoTotal / totalClientes : 0

    // Segmentos únicos
    const segmentos = ["todos", ...Array.from(new Set(clientes.map((c) => c.segmento)))]

    // Paginación / carrusel (limitar a 10 según petición)
    const pageSize = 10
    const [page, setPage] = useState(0)

    // Ordenamiento
    const [sortBy, setSortBy] = useState<'fecha' | 'gasto'>('fecha')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    // Aplicar ordenamiento antes de paginar
    const sortedClientes = [...clientesFiltrados].sort((a, b) => {
        let valA: any = 0
        let valB: any = 0
        if (sortBy === 'fecha') {
            valA = a.fechaRegistro ? a.fechaRegistro.getTime() : 0
            valB = b.fechaRegistro ? b.fechaRegistro.getTime() : 0
        } else {
            valA = Number(a.gastoTotal) || 0
            valB = Number(b.gastoTotal) || 0
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
    })

    const totalPages = Math.max(1, Math.ceil(sortedClientes.length / pageSize))
    const pagedClientes = sortedClientes.slice(page * pageSize, (page + 1) * pageSize)

    // reset page when filters / sorting / search change to avoid stale page indices
    useEffect(() => {
        setPage(0)
    }, [searchTerm, segmentoFilter, estadoFilter, dateFrom, dateTo, sortBy, sortDir])

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
                        <p className="text-muted-foreground">Visualiza y administra la base de clientes</p>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalClientes}</div>
                                <p className="text-xs text-muted-foreground">Clientes filtrados</p>
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                                <Users className="h-4 w-4" style={{ color: 'hsl(var(--color-positive))' }} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{clientesActivos}</div>
                                <p className="text-xs text-muted-foreground">Clientes activos</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatPrice(gastoTotal)}</div>
                                <p className="text-xs text-muted-foreground">De clientes filtrados</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gasto Promedio</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatPrice(gastoPromedio)}</div>
                                <p className="text-xs text-muted-foreground">Por cliente</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filtros */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filtros de Búsqueda</CardTitle>
                            <CardDescription>Filtra clientes por nombre, segmento o estado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium mb-2 block">Buscar Cliente</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nombre, ID o email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full md:w-[200px]">
                                        <label className="text-sm font-medium mb-2 block">Segmento</label>
                                        <Select value={segmentoFilter} onValueChange={setSegmentoFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {segmentos.map((seg) => (
                                                    <SelectItem key={seg} value={seg}>
                                                        {seg === "todos" ? "Todos" : seg}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full md:w-[200px]">
                                        <label className="text-sm font-medium mb-2 block">Estado</label>
                                        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todos">Todos</SelectItem>
                                                <SelectItem value="activo">Activo</SelectItem>
                                                <SelectItem value="inactivo">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm("")
                                            setSegmentoFilter("todos")
                                            setEstadoFilter("todos")
                                            setDateFrom(undefined)
                                            setDateTo(undefined)
                                        }}
                                    >
                                        <Filter className="mr-2 h-4 w-4" />
                                        Limpiar
                                    </Button>
                                </div>

                                {/* (Orden moved to a separate Card below) */}

                                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium mb-2 block">Fecha Desde</label>
                                        <Popover usePortal={false}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Seleccionar fecha"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-medium mb-2 block">Fecha Hasta</label>
                                        <Popover usePortal={false}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateTo ? format(dateTo, "PPP", { locale: es }) : "Seleccionar fecha"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ordenamiento (fecha / gasto) separado, colocado después de Filtros como en Ventas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ordenar</CardTitle>
                            <CardDescription>Ordenar los clientes en la lista</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium">Ordenar por:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="rounded-md px-3 py-2 text-sm"
                                    style={{
                                        backgroundColor: 'hsl(var(--color-popover))',
                                        color: 'hsl(var(--color-popover-foreground))',
                                        borderColor: 'hsl(var(--color-border))',
                                    }}
                                >
                                    <option value="fecha">Fecha</option>
                                    <option value="gasto">Total gastado</option>
                                </select>

                                <select
                                    value={sortDir}
                                    onChange={(e) => setSortDir(e.target.value as any)}
                                    className="rounded-md px-3 py-2 text-sm"
                                    style={{
                                        backgroundColor: 'hsl(var(--color-popover))',
                                        color: 'hsl(var(--color-popover-foreground))',
                                        borderColor: 'hsl(var(--color-border))',
                                    }}
                                >
                                    <option value="desc">Mayor → Menor</option>
                                    <option value="asc">Menor → Mayor</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla de Clientes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista de Clientes ({clientesFiltrados.length})</CardTitle>
                            <CardDescription>Información básica y actividad de los clientes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} variant="outline">←</Button>
                                        <span className="text-sm">Página {page + 1} / {totalPages}</span>
                                        <Button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} variant="outline">→</Button>
                                    </div>
                                    {loading ? <div className="text-sm">Cargando...</div> : errorLoad ? <div className="text-sm text-destructive">{errorLoad}</div> : null}
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Teléfono</TableHead>
                                            <TableHead>Fecha Registro</TableHead>
                                            <TableHead>Compras</TableHead>
                                            <TableHead>Total Gastado</TableHead>
                                            <TableHead>Segmento</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pagedClientes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center text-muted-foreground">
                                                    No se encontraron clientes con los filtros aplicados
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pagedClientes.map((c) => (
                                                <TableRow key={c.origId}>
                                                    <TableCell className="font-medium">{c.displayId}</TableCell>
                                                    <TableCell>{c.nombre}</TableCell>
                                                    <TableCell>{c.email}</TableCell>
                                                    <TableCell>{c.telefono}</TableCell>
                                                    <TableCell>{c.fechaRegistro ? format(c.fechaRegistro, "dd/MM/yyyy") : '-'}</TableCell>
                                                    <TableCell>{c.compras}</TableCell>
                                                    <TableCell className="font-semibold">{formatPrice(c.gastoTotal)}</TableCell>
                                                    <TableCell>{c.segmento}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={c.estado === "activo" ? "default" : "secondary"}
                                                        >
                                                            {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                                                        </Badge>
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
