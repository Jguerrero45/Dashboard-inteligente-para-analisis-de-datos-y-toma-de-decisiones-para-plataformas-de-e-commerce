"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  FileSpreadsheet,
  Download,
  CalendarIcon,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  FileText,
  BarChart3,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useCurrency } from "@/hooks/use-currency"
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
  {
    id: "general",
    nombre: "Reporte General",
    descripcion: "Resumen ejecutivo de todas las métricas",
    icon: BarChart3,
    brand: 5,
  },
]

export default function ReportesPage() {
  const { currency } = useCurrency()
  const [tipoReporte, setTipoReporte] = useState("ventas")
  const [formato, setFormato] = useState("excel")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [generando, setGenerando] = useState(false)

  // Función para generar reporte
  const generarReporte = async () => {
    setGenerando(true)
    try {
      if (formato === "pdf") {
        const params = new URLSearchParams()
        params.set("months", "12")
        params.set("top", "5")
        params.set("tipo", tipoReporte)
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
        // Para otros formatos (excel/csv) por ahora simulamos — se puede integrar endpoint similar
        // TODO: integrar endpoints de exportación real para Excel/CSV
        alert(`Reporte ${tipoReporte} generado en formato ${formato}`)
      }
    } catch (err: any) {
      console.error(err)
      alert("No se pudo generar el reporte: " + (err.message || err))
    } finally {
      setGenerando(false)
    }
  }

  // Estadísticas de reportes
  const estadisticas = [
    {
      titulo: "Reportes Generados",
      valor: "247",
      descripcion: "Este mes",
      icon: FileText,
    },
    {
      titulo: "Último Reporte",
      valor: "Hace 2 horas",
      descripcion: "Reporte de ventas",
      icon: FileSpreadsheet,
    },
    {
      titulo: "Formato Más Usado",
      valor: "Excel",
      descripcion: "85% de exportaciones",
      icon: Download,
    },
  ]

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
                      onClick={() => setTipoReporte(tipo.id)}
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
                    <label className="text-sm text-muted-foreground mb-2 block">Fecha Hasta</label>
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
                </div>
              </div>

              {/* Formato de Exportación */}
              <div>
                <h3 className="text-sm font-medium mb-3">Formato de Exportación</h3>
                <Select value={formato} onValueChange={setFormato}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Excel (.xlsx)</span>
                      </div>
                    </SelectItem>
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
                    Los valores se exportarán en: {" "}
                    <strong>{currency === "USD" ? "Dólares (USD)" : "Bolívares (Bs)"}</strong>
                  </span>
                </div>
              </div>

              {/* Botón de Generación */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {dateFrom && dateTo
                    ? `Período: ${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}`
                    : "Selecciona un rango de fechas para continuar"}
                </div>
                <Button
                  size="lg"
                  onClick={generarReporte}
                  disabled={!dateFrom || !dateTo || generando}
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
                  <p className="text-muted-foreground">Los archivos Excel incluyen múltiples hojas con diferentes vistas de los datos</p>
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

