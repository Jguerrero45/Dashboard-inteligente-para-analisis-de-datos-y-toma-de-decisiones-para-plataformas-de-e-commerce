"use client"

import { useState } from "react"
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

// Datos de ejemplo de clientes
const clientesData = [
    {
        id: "C001",
        nombre: "Juan Pérez",
        email: "juan.perez@example.com",
        telefono: "+57 300 1234567",
        fechaRegistro: new Date(2023, 6, 12),
        compras: 12,
        gastoTotal: 4599.5,
        segmento: "VIP",
        estado: "activo",
    },
    {
        id: "C002",
        nombre: "María González",
        email: "maria.gonzalez@example.com",
        telefono: "+57 310 7654321",
        fechaRegistro: new Date(2024, 0, 5),
        compras: 3,
        gastoTotal: 249.95,
        segmento: "Reciente",
        estado: "activo",
    },
    {
        id: "C003",
        nombre: "Carlos Rodríguez",
        email: "c.rodriguez@example.com",
        telefono: "+57 320 9876543",
        fechaRegistro: new Date(2022, 10, 20),
        compras: 25,
        gastoTotal: 11299.99,
        segmento: "Frecuente",
        estado: "activo",
    },
    {
        id: "C004",
        nombre: "Ana Martínez",
        email: "ana.martinez@example.com",
        telefono: "+57 311 5553333",
        fechaRegistro: new Date(2023, 3, 3),
        compras: 1,
        gastoTotal: 89.99,
        segmento: "Nuevo",
        estado: "inactivo",
    },
    {
        id: "C005",
        nombre: "Luis Fernández",
        email: "luis.fernandez@example.com",
        telefono: "+57 315 4442222",
        fechaRegistro: new Date(2021, 8, 14),
        compras: 40,
        gastoTotal: 20499.5,
        segmento: "VIP",
        estado: "activo",
    },
]

export default function ClientesPage() {
    const { formatPrice } = useCurrency()
    const [searchTerm, setSearchTerm] = useState("")
    const [segmentoFilter, setSegmentoFilter] = useState("todos")
    const [estadoFilter, setEstadoFilter] = useState("todos")
    const [dateFrom, setDateFrom] = useState<Date>()
    const [dateTo, setDateTo] = useState<Date>()

    // Filtrar clientes
    const clientesFiltrados = clientesData.filter((c) => {
        const matchSearch =
            c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchSegmento = segmentoFilter === "todos" || c.segmento === segmentoFilter
        const matchEstado = estadoFilter === "todos" || c.estado === estadoFilter
        const matchDateFrom = !dateFrom || c.fechaRegistro >= dateFrom
        const matchDateTo = !dateTo || c.fechaRegistro <= dateTo
        return matchSearch && matchSegmento && matchEstado && matchDateFrom && matchDateTo
    })

    // Estadísticas
    const totalClientes = clientesFiltrados.length
    const clientesActivos = clientesFiltrados.filter((c) => c.estado === "activo").length
    const gastoTotal = clientesFiltrados.reduce((sum, c) => sum + c.gastoTotal, 0)
    const gastoPromedio = totalClientes > 0 ? gastoTotal / totalClientes : 0

    // Segmentos únicos
    const segmentos = ["todos", ...Array.from(new Set(clientesData.map((c) => c.segmento)))]

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

                    {/* Tabla de Clientes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista de Clientes ({clientesFiltrados.length})</CardTitle>
                            <CardDescription>Información básica y actividad de los clientes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
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
                                        {clientesFiltrados.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center text-muted-foreground">
                                                    No se encontraron clientes con los filtros aplicados
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            clientesFiltrados.map((c) => (
                                                <TableRow key={c.id}>
                                                    <TableCell className="font-medium">{c.id}</TableCell>
                                                    <TableCell>{c.nombre}</TableCell>
                                                    <TableCell>{c.email}</TableCell>
                                                    <TableCell>{c.telefono}</TableCell>
                                                    <TableCell>{format(c.fechaRegistro, "dd/MM/yyyy")}</TableCell>
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
