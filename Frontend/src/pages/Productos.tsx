"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Package, TrendingUp, TrendingDown } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"

// Datos de ejemplo de productos
const productosData = [
  {
    id: "P001",
    nombre: "Laptop Pro 15",
    categoria: "Electrónica",
    precio: 1299.99,
    stock: 45,
    vendidos: 234,
    tendencia: "up",
    estado: "activo",
  },
  {
    id: "P002",
    nombre: "Mouse Gamer RGB",
    categoria: "Accesorios",
    precio: 49.99,
    stock: 156,
    vendidos: 892,
    tendencia: "up",
    estado: "activo",
  },
  {
    id: "P003",
    nombre: "Teclado Mecánico",
    categoria: "Accesorios",
    precio: 89.99,
    stock: 23,
    vendidos: 445,
    tendencia: "down",
    estado: "bajo-stock",
  },
  {
    id: "P004",
    nombre: "Monitor 4K 27",
    categoria: "Electrónica",
    precio: 449.99,
    stock: 67,
    vendidos: 178,
    tendencia: "up",
    estado: "activo",
  },
  {
    id: "P005",
    nombre: "Webcam HD Pro",
    categoria: "Accesorios",
    precio: 79.99,
    stock: 89,
    vendidos: 567,
    tendencia: "up",
    estado: "activo",
  },
  {
    id: "P006",
    nombre: "Auriculares Bluetooth",
    categoria: "Audio",
    precio: 129.99,
    stock: 12,
    vendidos: 723,
    tendencia: "down",
    estado: "bajo-stock",
  },
  {
    id: "P007",
    nombre: "SSD 1TB NVMe",
    categoria: "Almacenamiento",
    precio: 159.99,
    stock: 134,
    vendidos: 456,
    tendencia: "up",
    estado: "activo",
  },
  {
    id: "P008",
    nombre: "Router WiFi 6",
    categoria: "Redes",
    precio: 199.99,
    stock: 0,
    vendidos: 289,
    tendencia: "down",
    estado: "agotado",
  },
]

export default function ProductosPage() {
  const { formatPrice } = useCurrency()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("todas")
  const [estadoFilter, setEstadoFilter] = useState("todos")

  // Filtrar productos
  const productosFiltrados = productosData.filter((producto) => {
    const matchSearch =
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = categoriaFilter === "todas" || producto.categoria === categoriaFilter
    const matchEstado = estadoFilter === "todos" || producto.estado === estadoFilter
    return matchSearch && matchCategoria && matchEstado
  })

  // Obtener categorías únicas
  const categorias = ["todas", ...Array.from(new Set(productosData.map((p) => p.categoria)))]

  // Calcular estadísticas
  const totalProductos = productosData.length
  const stockTotal = productosData.reduce((sum, p) => sum + p.stock, 0)
  const productosActivos = productosData.filter((p) => p.estado === "activo").length
  const productosBajoStock = productosData.filter((p) => p.estado === "bajo-stock").length

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
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productosActivos}</div>
                <p className="text-xs text-muted-foreground">Con stock normal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bajo Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Vendidos</TableHead>
                      <TableHead>Tendencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No se encontraron productos con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      productosFiltrados.map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell className="font-medium">{producto.id}</TableCell>
                          <TableCell>{producto.nombre}</TableCell>
                          <TableCell>{producto.categoria}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(producto.precio)}</TableCell>
                          <TableCell>
                            <span
                              className={
                                producto.stock === 0 ? "text-red-500" : producto.stock < 30 ? "text-orange-500" : ""
                              }
                            >
                              {producto.stock}
                            </span>
                          </TableCell>
                          <TableCell>{producto.vendidos}</TableCell>
                          <TableCell>
                            {producto.tendencia === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                producto.estado === "activo"
                                  ? "default"
                                  : producto.estado === "bajo-stock"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {producto.estado === "activo"
                                ? "Activo"
                                : producto.estado === "bajo-stock"
                                  ? "Bajo Stock"
                                  : "Agotado"}
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
