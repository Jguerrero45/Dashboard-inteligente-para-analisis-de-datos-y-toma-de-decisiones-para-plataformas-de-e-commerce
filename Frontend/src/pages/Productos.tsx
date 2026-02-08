"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Package, TrendingUp, TrendingDown, Download } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { getApiBase } from "@/lib/activeStore"


// Estado local: será llenado desde la API
const productosData: Array<any> = []

export default function ProductosPage() {
  const { formatPrice } = useCurrency()
  const API_BASE = getApiBase()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("todas")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [productos, setProductos] = useState<any[]>(productosData)
  const [loading, setLoading] = useState(false)
  const [errorLoad, setErrorLoad] = useState<string | null>(null)

  // Cargar productos desde la API (reutilizable)
  async function fetchProductos() {
    setLoading(true)
    setErrorLoad(null)
    try {
      const res = await fetch(`${API_BASE}/Productos/`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Error al cargar productos')
      }
      const data = await res.json()
      const normalized = data.map((p: any) => ({
        origId: p.id,
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: parseFloat(p.precio) || 0,
        costo: p.costo != null ? Number(p.costo) : null,
        stock: Number(p.stock) || 0,
        vendidos: p.vendidos_total != null ? Number(p.vendidos_total) : (p.vendidos || Number(p.ventas_count) || 0),
        ventas_count: p.ventas_count,
        ingreso_total: p.ingreso_total != null ? parseFloat(p.ingreso_total) : 0,
        vendidos_total: p.vendidos_total != null ? Number(p.vendidos_total) : null,
        ultima_venta: p.ultima_venta ? new Date(p.ultima_venta) : null,
        tendencias: p.tendencias,
        tendencia: (p.tendencias === 'alta' ? 'up' : (p.tendencias === 'baja' ? 'down' : 'neutral')),
        estado: p.estado,
      }))
      setProductos(normalized)
    } catch (err: any) {
      console.error('Error cargando productos', err)
      setErrorLoad(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProductos() }, [])
  function handleExportProductos() {
    const a = document.createElement('a')
    a.href = '/api/export/csv/?tipo=productos&count=all'
    a.download = 'productos.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // Funcionalidad de costos se movió al módulo "Costos"

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    const matchSearch =
      String(producto.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(producto.id).toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = categoriaFilter === "todas" || producto.categoria === categoriaFilter
    const matchEstado = estadoFilter === "todos" || producto.estado === estadoFilter
    return matchSearch && matchCategoria && matchEstado
  })

  // Obtener categorías únicas (desde los productos cargados)
  const categorias = ["todas", ...Array.from(new Set(productos.map((p) => p.categoria)))]

  // Calcular estadísticas
  const totalProductos = productos.length
  const stockTotal = productos.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
  const productosActivos = productos.filter((p) => p.estado === "activo").length
  const productosBajoStock = productos.filter((p) => p.estado === "bajo-stock").length

  // Paginación / carrusel: limitar a 10
  const pageSize = 10
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / pageSize))
  const pagedProductos = productosFiltrados.slice(page * pageSize, (page + 1) * pageSize)

  // reset page when filters/search change
  useEffect(() => {
    setPage(0)
  }, [searchTerm, categoriaFilter, estadoFilter])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
            <p className="text-muted-foreground">Visualiza y filtra el inventario de productos</p>
          </div>

          {/* Estadísticas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProductos}</div>
                <p className="text-xs text-muted-foreground">En catálogo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stockTotal}</div>
                <p className="text-xs text-muted-foreground">Unidades disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
                <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--color-positive))' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productosActivos}</div>
                <p className="text-xs text-muted-foreground">Con stock normal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bajo Stock</CardTitle>
                <TrendingDown className="h-4 w-4" style={{ color: 'hsl(var(--brand-4))' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productosBajoStock}</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Búsqueda</CardTitle>
              <CardDescription>Filtra productos por nombre, categoría o estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Buscar Producto</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Categoría</label>
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
                      <SelectItem value="bajo-stock">Bajo Stock</SelectItem>
                      <SelectItem value="agotado">Agotado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setCategoriaFilter("todas")
                    setEstadoFilter("todos")
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Productos ({productosFiltrados.length})</CardTitle>
              <CardDescription>Visualización detallada del inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} variant="outline">←</Button>
                    <span className="text-sm">Página {page + 1} / {totalPages}</span>
                    <Button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} variant="outline">→</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {loading ? <div className="text-sm">Cargando...</div> : errorLoad ? <div className="text-sm text-destructive">{errorLoad}</div> : null}
                  </div>
                </div>
                {loading ? <div className="px-4 py-2 text-sm">Cargando...</div> : errorLoad ? <div className="px-4 py-2 text-sm text-destructive">{errorLoad}</div> : null}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Costo</TableHead>

                      <TableHead>Stock</TableHead>
                      <TableHead>Vendidos</TableHead>
                      <TableHead>Tendencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedProductos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                          No se encontraron productos con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedProductos.map((producto) => {
                        return (
                          <TableRow key={producto.origId}>
                            <TableCell className="font-medium">{producto.id}</TableCell>
                            <TableCell>{producto.nombre}</TableCell>
                            <TableCell>{producto.categoria}</TableCell>
                            <TableCell className="font-semibold">{formatPrice(producto.precio)}</TableCell>
                            <TableCell>
                              {producto.costo != null ? formatPrice(producto.costo) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell>
                              <span style={{
                                color: producto.stock === 0 ? 'hsl(var(--color-negative))' : producto.stock < 30 ? 'hsl(var(--brand-4))' : undefined,
                              }}>
                                {producto.stock}
                              </span>
                            </TableCell>
                            <TableCell>{producto.vendidos}</TableCell>
                            <TableCell>
                              {producto.tendencia === "up" ? (
                                <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--color-positive))' }} />
                              ) : (
                                <TrendingDown className="h-4 w-4" style={{ color: 'hsl(var(--color-negative))' }} />
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={producto.estado} />
                            </TableCell>
                          </TableRow>
                        )
                      })
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
