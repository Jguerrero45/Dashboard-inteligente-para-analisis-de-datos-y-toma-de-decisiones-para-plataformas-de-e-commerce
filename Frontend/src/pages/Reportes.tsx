"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Download,
  CalendarIcon,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  FileText,

} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"

// Tipos de reportes disponibles
const tiposReporte = [
  {
    id: "ventas",
    nombre: "Reporte de Ventas",
    descripcion: "Análisis detallado de todas las transacciones",
    icon: TrendingUp,
    brand: 2,
  },
  {
    id: "productos",
    nombre: "Reporte de Productos",
    descripcion: "Inventario, stock y movimientos de productos",
    icon: Package,
    brand: 1,
  },
  {
    id: "clientes",
    nombre: "Reporte de Clientes",
    descripcion: "Análisis de comportamiento y segmentación",
    icon: Users,
    brand: 3,
  },

]

type ColumnOption = { id: string; label: string }

const columnasPorTipo: Record<string, ColumnOption[]> = {
  ventas: [
    { id: "id", label: "ID" },
    { id: "fecha", label: "Fecha" },
    { id: "cliente_nombre", label: "Cliente" },
    { id: "cliente_id", label: "Cliente ID" },
    { id: "precio_total", label: "Total" },
    { id: "metodo_compra", label: "Método" },
    { id: "estado", label: "Estado" },
    { id: "productos", label: "Productos" },
  ],
  productos: [
    { id: "id", label: "ID" },
    { id: "nombre", label: "Nombre" },
    { id: "categoria", label: "Categoría" },
    { id: "precio", label: "Precio" },
    { id: "costo", label: "Costo" },
    { id: "stock", label: "Stock" },
    { id: "vendidos", label: "Vendidos" },
    { id: "tendencias", label: "Tendencia" },
    { id: "estado", label: "Estado" },
  ],
  clientes: [
    { id: "id", label: "ID" },
    { id: "display_id", label: "ID visible" },
    { id: "nombre", label: "Nombre" },
    { id: "apellido", label: "Apellido" },
    { id: "correo", label: "Email" },
    { id: "telefono", label: "Teléfono" },
    { id: "ciudad", label: "Ciudad" },
    { id: "fecha_registro", label: "Fecha registro" },
    { id: "tipo_cliente", label: "Tipo" },
  ],
}

const columnasDefault: Record<string, string[]> = {
  ventas: ["id", "fecha", "cliente_nombre", "precio_total", "metodo_compra", "estado", "productos"],
  productos: ["id", "nombre", "categoria", "precio", "stock", "vendidos", "tendencias", "estado"],
  clientes: ["id", "nombre", "apellido", "correo", "telefono", "ciudad", "fecha_registro", "tipo_cliente"],
}

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState("ventas")
  const [formato, setFormato] = useState("csv")
  const [productCount, setProductCount] = useState<string>("10")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [generando, setGenerando] = useState(false)
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState<Record<string, string[]>>(columnasDefault)

  useEffect(() => {
    setColumnasSeleccionadas((prev) => {
      if (prev[tipoReporte]) return prev
      return { ...prev, [tipoReporte]: columnasDefault[tipoReporte] || [] }
    })
  }, [tipoReporte])

  const columnasDisponibles = columnasPorTipo[tipoReporte] || []
  const columnasActuales = columnasSeleccionadas[tipoReporte] || columnasDefault[tipoReporte] || []

  const toggleColumna = (colId: string) => {
    setColumnasSeleccionadas((prev) => {
      const current = prev[tipoReporte] || columnasDefault[tipoReporte] || []
      const exists = current.includes(colId)
      const nextSet = new Set(current)
      if (exists) {
        nextSet.delete(colId)
      } else {
        nextSet.add(colId)
      }
      const next = columnasDisponibles.map((c) => c.id).filter((id) => nextSet.has(id))
      if (next.length === 0) {
        return prev
      }
      return { ...prev, [tipoReporte]: next }
    })
  }

  // Función para generar reporte
  const generarReporte = async () => {
    setGenerando(true)
    try {
      if (!(tipoReporte === 'productos' || tipoReporte === 'ventas' || tipoReporte === 'clientes')) {
        alert('Tipo de reporte no soportado.')
        return
      }
      const formatoDestino = formato

      if (formatoDestino === "pdf") {
        const params = new URLSearchParams()
        params.set("months", "12")
        params.set("top", "5")
        params.set("tipo", tipoReporte)
        if (columnasActuales.length === 0) {
          alert("Selecciona al menos una columna para exportar.")
          return
        }
        params.set("columns", columnasActuales.join(","))
        // include product count for PDF requests as well
        params.set('count', productCount || '10')
        if (dateFrom) params.set("date_from", dateFrom.toISOString())
        if (dateTo) params.set("date_to", dateTo.toISOString())


        const res = await fetch(`/api/export/pdf/?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        })

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(text || "Error al generar el PDF")
        }

        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url

        // Detectar fallback del servidor (cuando wkhtmltopdf no está instalado)
        const wkMissing = res.headers.get("X-Wkhtmltopdf-Missing")
        const contentType = res.headers.get("Content-Type") || res.headers.get("content-type") || ""
        const contentDisp = res.headers.get("Content-Disposition") || res.headers.get("content-disposition") || ""

        // intentar extraer filename desde Content-Disposition si existe
        let filename = ''
        const match = contentDisp.match(/filename\*=UTF-8''([^;\n\r]*)/i) || contentDisp.match(/filename="?([^";\n\r]*)"?/i)
        if (match && match[1]) {
          try {
            filename = decodeURIComponent(match[1])
          } catch (e) {
            filename = match[1]
          }
        }

        if (!filename) {
          if (wkMissing || contentType.includes('text/html')) {
            filename = `reporte_${tipoReporte}.html`
            alert('wkhtmltopdf no está instalado en el servidor. Se ha descargado el HTML del reporte como fallback. Para un PDF real instala wkhtmltopdf en el servidor.')
          } else {
            filename = `reporte_${tipoReporte}.pdf`
          }
        }

        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        // CSV/Excel -> call CSV export endpoint
        const params = new URLSearchParams()
        params.set('tipo', tipoReporte)
        if (columnasActuales.length === 0) {
          alert("Selecciona al menos una columna para exportar.")
          return
        }
        params.set('columns', columnasActuales.join(','))
        // map excel to csv endpoint as backend returns CSV
        const count = productCount || '10'
        params.set('count', count)
        if (dateFrom) params.set('date_from', dateFrom.toISOString())
        if (dateTo) params.set('date_to', dateTo.toISOString())


        const res = await fetch(`/api/export/csv/?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'text/csv',
          },
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || 'Error al generar el CSV')
        }

        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        // try to get filename from headers
        const contentDisp = res.headers.get('Content-Disposition') || res.headers.get('content-disposition') || ''
        let filename = ''
        const match = contentDisp.match(/filename\*=UTF-8''([^;\n\r]*)/i) || contentDisp.match(/filename="?([^";\n\r]*)"?/i)
        if (match && match[1]) {
          try { filename = decodeURIComponent(match[1]) } catch (e) { filename = match[1] }
        }
        if (!filename) filename = `${tipoReporte}_${count}.csv`

        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      console.error(err)
      alert("No se pudo generar el reporte: " + (err.message || err))
    } finally {
      setGenerando(false)
    }
  }

  // Estadísticas de reportes


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Centro de Reportes</h1>
            <p className="text-muted-foreground">Genera y exporta reportes personalizados en múltiples formatos</p>
          </div>

          {/* Estadísticas (eliminadas a petición) */}

          {/* Tipos de Reportes */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Reportes Disponibles</CardTitle>
              <CardDescription>Selecciona el tipo de reporte que deseas generar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tiposReporte.map((tipo) => {
                  const Icon = tipo.icon
                  return (
                    <Card
                      key={tipo.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${tipoReporte === tipo.id ? "ring-2 ring-primary" : ""
                        }`}
                      onClick={() => {
                        setTipoReporte(tipo.id)

                      }}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg`}
                            style={{ background: `hsl(var(--brand-${tipo.brand}) / 0.12)` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: `hsl(var(--brand-${tipo.brand}))` }} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{tipo.nombre}</CardTitle>
                          </div>
                          {tipoReporte === tipo.id && <Badge>Seleccionado</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{tipo.descripcion}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Exportación */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Exportación</CardTitle>
              <CardDescription>Personaliza el rango de fechas y formato de salida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rango de Fechas */}
              <div>
                <h3 className="text-sm font-medium mb-3">Rango de Fechas</h3>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-2 block">Fecha Desde</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline"
                          className={`w-full justify-start text-left font-normal bg-transparent ${tipoReporte !== 'ventas' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={tipoReporte !== 'ventas'}
                          title={tipoReporte !== 'ventas' ? 'Fechas deshabilitadas en esta vista' : ''}
                        >
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
                    <label className="text-sm text-muted-foreground mb-2 block">Fecha Hasta</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline"
                          className={`w-full justify-start text-left font-normal bg-transparent ${tipoReporte !== 'ventas' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={tipoReporte !== 'ventas'}
                          title={tipoReporte !== 'ventas' ? 'Fechas deshabilitadas en esta vista' : ''}
                        >
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

              {/* Cantidad de Productos */}
              <div>
                <h3 className="text-sm font-medium mb-3">Cantidad de Productos</h3>
                <Select value={productCount} onValueChange={setProductCount} disabled={tipoReporte === 'ventas'}>
                  <SelectTrigger className={`w-full md:w-[300px] ${tipoReporte === 'ventas' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder="Seleccionar cantidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Últimos 10</SelectItem>
                    <SelectItem value="25">Últimos 25</SelectItem>
                    <SelectItem value="50">Últimos 50</SelectItem>
                    <SelectItem value="100">Últimos 100</SelectItem>
                    <SelectItem value="250">Últimos 250</SelectItem>
                    <SelectItem value="500">Últimos 500</SelectItem>
                    <SelectItem value="1000">Últimos 1000</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Columnas a Exportar */}
              <div>
                <h3 className="text-sm font-medium mb-3">Columnas a Exportar</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {columnasDisponibles.map((col) => (
                    <label key={col.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={columnasActuales.includes(col.id)}
                        onChange={() => toggleColumna(col.id)}
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
                {tipoReporte === 'ventas' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Desmarca "Productos" si quieres exportar solo el resumen de la venta.
                  </p>
                )}
              </div>

              {/* Formato de Exportación */}
              <div>
                <h3 className="text-sm font-medium mb-3">Formato de Exportación</h3>
                <Select
                  value={formato}
                  onValueChange={(v) => { setFormato(v) }}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>CSV (.csv)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>PDF (.pdf)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Información de Moneda */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Las exportaciones siempre se generan en Dólares (USD).
                  </span>
                </div>
              </div>

              {/* Botón de Generación */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                <div className="text-sm">
                  {tipoReporte === 'ventas' ? (
                    dateFrom && dateTo ? (
                      `Período: ${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}`
                    ) : (
                      <span className="text-muted-foreground">Sin filtro de fechas (todas las ventas)</span>
                    )
                  ) : null}
                </div>
                <Button
                  size="lg"
                  onClick={generarReporte}
                  disabled={generando}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {generando ? "Generando..." : "Generar y Descargar Reporte"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Reporte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <p className="text-muted-foreground">
                    Los reportes incluyen análisis detallado de métricas, gráficos y tablas de datos
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <p className="text-muted-foreground">Los archivos CSV se importan fácilmente en hojas de cálculo y herramientas de análisis</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <p className="text-muted-foreground">Los reportes PDF son ideales para presentaciones y documentación formal</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <p className="text-muted-foreground">Los archivos CSV son perfectos para análisis adicional en otras herramientas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <DashboardFooter />
    </div>
  )
}

