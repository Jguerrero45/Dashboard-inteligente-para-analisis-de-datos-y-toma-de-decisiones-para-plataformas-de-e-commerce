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
import { Search, Filter, CalendarIcon, DollarSign, ShoppingCart, TrendingUp } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"

// Datos de ejemplo de ventas
const ventasData = [
  {
    id: "V001",
    fecha: new Date(2024, 0, 15),
    cliente: "Juan Pérez",
    producto: "Laptop Pro 15",
    cantidad: 2,
    precioUnitario: 1299.99,
    total: 2599.98,
    estado: "completada",
    metodo: "tarjeta",
  },
  {
    id: "V002",
    fecha: new Date(2024, 0, 16),
    cliente: "María González",
    producto: "Mouse Gamer RGB",
    cantidad: 5,
    precioUnitario: 49.99,
    total: 249.95,
    estado: "completada",
    metodo: "efectivo",
  },
  {
    id: "V003",
    fecha: new Date(2024, 0, 16),
    cliente: "Carlos Rodríguez",
    producto: "Monitor 4K 27",
    cantidad: 1,
    precioUnitario: 449.99,
    total: 449.99,
    estado: "pendiente",
    metodo: "transferencia",
  },
  {
    id: "V004",
    fecha: new Date(2024, 0, 17),
    cliente: "Ana Martínez",
    producto: "Teclado Mecánico",
    cantidad: 3,
    precioUnitario: 89.99,
    total: 269.97,
    estado: "completada",
    metodo: "tarjeta",
  },
  {
    id: "V005",
    fecha: new Date(2024, 0, 18),
    cliente: "Luis Fernández",
    producto: "Webcam HD Pro",
    cantidad: 1,
    precioUnitario: 79.99,
    total: 79.99,
    estado: "completada",
    metodo: "tarjeta",
  },
  {
    id: "V006",
    fecha: new Date(2024, 0, 18),
    cliente: "Sofia López",
    producto: "Auriculares Bluetooth",
    cantidad: 2,
    precioUnitario: 129.99,
    total: 259.98,
    estado: "cancelada",
    metodo: "tarjeta",
  },
  {
    id: "V007",
    fecha: new Date(2024, 0, 19),
    cliente: "Pedro Sánchez",
    producto: "SSD 1TB NVMe",
    cantidad: 4,
    precioUnitario: 159.99,
    total: 639.96,
    estado: "completada",
    metodo: "transferencia",
  },
  {
    id: "V008",
    fecha: new Date(2024, 0, 20),
    cliente: "Laura Torres",
    producto: "Router WiFi 6",
    cantidad: 1,
    precioUnitario: 199.99,
    total: 199.99,
    estado: "completada",
    metodo: "efectivo",
  },
]

export default function VentasPage() {
  const { formatPrice } = useCurrency()
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todas")
  const [metodoFilter, setMetodoFilter] = useState("todos")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  // Filtrar ventas
  const ventasFiltradas = ventasData.filter((venta) => {
    const matchSearch =
      venta.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.producto.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = estadoFilter === "todas" || venta.estado === estadoFilter
    const matchMetodo = metodoFilter === "todos" || venta.metodo === metodoFilter
    const matchDateFrom = !dateFrom || venta.fecha >= dateFrom
    const matchDateTo = !dateTo || venta.fecha <= dateTo
    return matchSearch && matchEstado && matchMetodo && matchDateFrom && matchDateTo
  })

  // Calcular estadísticas
  const totalVentas = ventasFiltradas.length
  const ventasCompletadas = ventasFiltradas.filter((v) => v.estado === "completada").length
  const ingresoTotal = ventasFiltradas.filter((v) => v.estado === "completada").reduce((sum, v) => sum + v.total, 0)
  const ticketPromedio = ventasCompletadas > 0 ? ingresoTotal / ventasCompletadas : 0

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
                <TrendingUp className="h-4 w-4 text-green-500" />
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
                    <Popover>
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
                    <Popover>
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

          {/* Tabla de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Ventas ({ventasFiltradas.length})</CardTitle>
              <CardDescription>Historial completo de transacciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No se encontraron ventas con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      ventasFiltradas.map((venta) => (
                        <TableRow key={venta.id}>
                          <TableCell className="font-medium">{venta.id}</TableCell>
                          <TableCell>{format(venta.fecha, "dd/MM/yyyy")}</TableCell>
                          <TableCell>{venta.cliente}</TableCell>
                          <TableCell>{venta.producto}</TableCell>
                          <TableCell>{venta.cantidad}</TableCell>
                          <TableCell>{formatPrice(venta.precioUnitario)}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(venta.total)}</TableCell>
                          <TableCell className="capitalize">{venta.metodo}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                venta.estado === "completada"
                                  ? "default"
                                  : venta.estado === "pendiente"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
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
