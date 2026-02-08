"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, CalendarIcon, DollarSign, ShoppingCart, TrendingUp } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { getApiBase } from "@/lib/activeStore"

// Datos de ejemplo de ventas. Cada venta puede contener varios items.
const ventasData = [
  {
    id: "V001",
    fecha: new Date(2024, 0, 15),
    cliente: "Juan Pérez",
    // producto mantiene un resumen para búsquedas/preview (opcional)
    producto: "Laptop Pro 15",
    items: [
      { producto: "Laptop Pro 15", cantidad: 1, precioUnitario: 1299.99 },
      { producto: "Base Refrigerante", cantidad: 1, precioUnitario: 99.99 },
    ],
    total: 1399.98,
    estado: "completada",
    metodo: "tarjeta",
  },
  {
    id: "V002",
    fecha: new Date(2024, 0, 16),
    cliente: "María González",
    producto: "Mouse Gamer RGB",
    items: [
      { producto: "Mouse Gamer RGB", cantidad: 2, precioUnitario: 49.99 },
      { producto: "Alfombrilla Extendida", cantidad: 1, precioUnitario: 29.99 },
    ],
    total: 129.97,
    estado: "completada",
    metodo: "efectivo",
  },
  {
    id: "V003",
    fecha: new Date(2024, 0, 16),
    cliente: "Carlos Rodríguez",
    producto: "Monitor 4K 27",
    items: [{ producto: "Monitor 4K 27", cantidad: 1, precioUnitario: 449.99 }],
    total: 449.99,
    estado: "pendiente",
    metodo: "transferencia",
  },
  {
    id: "V004",
    fecha: new Date(2024, 0, 17),
    cliente: "Ana Martínez",
    producto: "Teclado Mecánico",
    items: [{ producto: "Teclado Mecánico", cantidad: 3, precioUnitario: 89.99 }],
    total: 269.97,
    estado: "completada",
    metodo: "tarjeta",
  },
  {
    id: "V005",
    fecha: new Date(2024, 0, 18),
    cliente: "Luis Fernández",
    producto: "Webcam HD Pro",
    items: [{ producto: "Webcam HD Pro", cantidad: 1, precioUnitario: 79.99 }],
    total: 79.99,
    estado: "completada",
    metodo: "tarjeta",
  },
  {
    id: "V006",
    fecha: new Date(2024, 0, 18),
    cliente: "Sofia López",
    producto: "Auriculares Bluetooth",
    items: [{ producto: "Auriculares Bluetooth", cantidad: 2, precioUnitario: 129.99 }],
    total: 259.98,
    estado: "cancelada",
    metodo: "tarjeta",
  },
  {
    id: "V007",
    fecha: new Date(2024, 0, 19),
    cliente: "Pedro Sánchez",
    producto: "SSD 1TB NVMe",
    items: [{ producto: "SSD 1TB NVMe", cantidad: 4, precioUnitario: 159.99 }],
    total: 639.96,
    estado: "completada",
    metodo: "transferencia",
  },
  {
    id: "V008",
    fecha: new Date(2024, 0, 20),
    cliente: "Laura Torres",
    producto: "Router WiFi 6",
    items: [{ producto: "Router WiFi 6", cantidad: 1, precioUnitario: 199.99 }],
    total: 199.99,
    estado: "completada",
    metodo: "efectivo",
  },
]

export default function VentasPage() {
  const { formatPrice } = useCurrency()
  const API_BASE = getApiBase()
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [ventas, setVentas] = useState<any[]>(ventasData)
  const [loading, setLoading] = useState(false)
  const [errorLoad, setErrorLoad] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todas")
  const [metodoFilter, setMetodoFilter] = useState("todos")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  // Paginación / carrusel para ventas (limitar a 10)
  const pageSize = 10
  const [page, setPage] = useState(0)
  // Ordenamiento (similar a Clientes)
  const [sortBy, setSortBy] = useState<'fecha' | 'total'>('fecha')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Cargar ventas desde la API al montar
  React.useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/Ventas/`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || 'Error al cargar ventas')
        }
        return res.json()
      })
      .then((data) => {
        // normalizar la respuesta para la UI
        const normalized = data.map((v: any) => ({
          id: v.id,
          fecha: v.fecha ? new Date(v.fecha) : null,
          cliente: v.cliente_nombre || v.cliente || '',
          producto: (v.items && v.items[0] && (v.items[0].producto_nombre || v.items[0].producto)) || v.producto || '',
          items: (v.items || []).map((it: any) => ({
            producto: it.producto_nombre || it.producto,
            cantidad: Number(it.cantidad) || 0,
            precioUnitario: parseFloat(it.precio_unitario || it.precioUnitario || 0),
            subtotal: parseFloat(it.precio_total || (it.precio_unitario * it.cantidad) || 0),
          })),
          total: parseFloat(v.precio_total || v.total || 0),
          estado: v.estado || v.estado || '',
          metodo: v.metodo_compra || v.metodo || '',
        }))
        setVentas(normalized)
      })
      .catch((err) => {
        console.error('Error cargando ventas', err)
        setErrorLoad(String(err))
      })
      .finally(() => setLoading(false))
  }, [])

  // Filtrar ventas
  const ventasFiltradas = ventas.filter((venta) => {
    const search = String(searchTerm || '').toLowerCase()
    const idStr = String(venta?.id ?? '')
    const clienteStr = String((venta?.cliente) ?? '')
    const productoStr = String((venta?.producto) ?? '')
    const matchSearch =
      idStr.toLowerCase().includes(search) ||
      clienteStr.toLowerCase().includes(search) ||
      // buscar en resumen de producto o en los items
      (productoStr && productoStr.toLowerCase().includes(search)) ||
      (Array.isArray(venta.items) && venta.items.some((it: any) => String(it.producto || '').toLowerCase().includes(search)))
    const matchEstado = estadoFilter === "todas" || venta.estado === estadoFilter
    const matchMetodo = metodoFilter === "todos" || venta.metodo === metodoFilter
    // Comparar solo la parte fecha (día) para evitar exclusiones por zona horaria
    const toDateOnly = (d?: Date | null) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : null)
    const ventaDateOnly = venta.fecha ? toDateOnly(venta.fecha) : null
    const fromOnly = toDateOnly(dateFrom)
    const toOnly = toDateOnly(dateTo)
    const matchDateFrom = !fromOnly || (ventaDateOnly !== null && ventaDateOnly >= fromOnly)
    const matchDateTo = !toOnly || (ventaDateOnly !== null && ventaDateOnly <= toOnly)
    return matchSearch && matchEstado && matchMetodo && matchDateFrom && matchDateTo
  })

  // Calcular estadísticas
  const totalVentas = ventasFiltradas.length
  const ventasCompletadas = ventasFiltradas.filter((v) => v.estado === "completada").length
  const ingresoTotal = ventasFiltradas.filter((v) => v.estado === "completada").reduce((sum, v) => sum + v.total, 0)
  const ticketPromedio = ventasCompletadas > 0 ? ingresoTotal / ventasCompletadas : 0

  // Aplicar ordenamiento antes de paginar (fecha o total)
  const sortedVentas = [...ventasFiltradas].sort((a, b) => {
    let valA: number = 0
    let valB: number = 0
    if (sortBy === 'fecha') {
      valA = a.fecha ? new Date(a.fecha).getTime() : 0
      valB = b.fecha ? new Date(b.fecha).getTime() : 0
    } else {
      valA = Number(a.total) || 0
      valB = Number(b.total) || 0
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1
    if (valA > valB) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  // paginación para la tabla de ventas
  const totalPages = Math.max(1, Math.ceil(sortedVentas.length / pageSize))
  const pagedVentas = sortedVentas.slice(page * pageSize, (page + 1) * pageSize)

  // reset page when filters/search/sort change
  React.useEffect(() => {
    setPage(0)
  }, [searchTerm, estadoFilter, metodoFilter, dateFrom, dateTo, sortBy, sortDir])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Ventas</h1>
            <p className="text-muted-foreground">Visualiza y analiza todas las transacciones</p>
          </div>

          {/* Estadísticas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVentas}</div>
                <p className="text-xs text-muted-foreground">Transacciones filtradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--color-positive))' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ventasCompletadas}</div>
                <p className="text-xs text-muted-foreground">Ventas exitosas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingreso Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(ingresoTotal)}</div>
                <p className="text-xs text-muted-foreground">De ventas completadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(ticketPromedio)}</div>
                <p className="text-xs text-muted-foreground">Por transacción</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Búsqueda</CardTitle>
              <CardDescription>Filtra ventas por fecha, estado o método de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Buscar Venta</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por ID, cliente o producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-[180px]">
                    <label className="text-sm font-medium mb-2 block">Estado</label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-[180px]">
                    <label className="text-sm font-medium mb-2 block">Método de Pago</label>
                    <Select value={metodoFilter} onValueChange={setMetodoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setEstadoFilter("todas")
                      setMetodoFilter("todos")
                      setDateFrom(undefined)
                      setDateTo(undefined)
                    }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ordenamiento (fecha / total) */}
          <Card>
            <CardHeader>
              <CardTitle>Ordenar</CardTitle>
              <CardDescription>Ordenar las ventas en la lista</CardDescription>
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
                  <option value="total">Total</option>
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

          {/* Tabla de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Ventas ({ventasFiltradas.length})</CardTitle>
              <CardDescription>Historial completo de transacciones</CardDescription>
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
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No se encontraron ventas con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedVentas.map((venta) => (
                        <React.Fragment key={venta.id}>
                          <TableRow>
                            <TableCell className="font-medium">{venta.id}</TableCell>
                            <TableCell>{venta.fecha ? format(venta.fecha, "dd/MM/yyyy") : "-"}</TableCell>
                            <TableCell>{venta.cliente}</TableCell>
                            <TableCell>
                              <Button onClick={() => toggleExpand(venta.id)} variant="outline">{expandedIds.includes(venta.id) ? '–' : '...'}</Button>
                            </TableCell>
                            <TableCell className="font-semibold">{formatPrice(venta.total)}</TableCell>
                            <TableCell className="capitalize">{venta.metodo}</TableCell>
                            <TableCell>
                              <StatusBadge status={venta.estado} />
                            </TableCell>
                          </TableRow>
                          {expandedIds.includes(venta.id) && (
                            <TableRow>
                              <TableCell colSpan={7} className="border-t">
                                <div className="p-4">
                                  <div className="p-4 rounded-md border shadow-sm bg-transparent">
                                    <h4 className="font-medium mb-2">Productos en la venta</h4>
                                    <div className="overflow-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="text-left text-xs text-muted-foreground">
                                            <th className="pb-2">Producto</th>
                                            <th className="pb-2">Cantidad</th>
                                            <th className="pb-2">Precio Unit.</th>
                                            <th className="pb-2">Subtotal</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Array.isArray(venta.items) && venta.items.map((it: any, idx: number) => (
                                            <tr key={idx} className="border-t">
                                              <td className="py-2">{it.producto}</td>
                                              <td className="py-2">{it.cantidad}</td>
                                              <td className="py-2">{formatPrice(it.precioUnitario)}</td>
                                              <td className="py-2">{formatPrice((it.precioUnitario || 0) * (it.cantidad || 0))}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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
