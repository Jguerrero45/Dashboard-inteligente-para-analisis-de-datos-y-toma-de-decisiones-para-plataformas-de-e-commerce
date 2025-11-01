"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Target,
  ShoppingCart,
  Users,
  DollarSign,
} from "lucide-react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import ChartInfo from "@/components/ui/chart-info"
import { useCurrency } from "@/hooks/use-currency"

// Datos de predicción de ventas
const salesPredictionData = [
  { month: "Ene", real: 45000, prediccion: 45200, confianza: 95 },
  { month: "Feb", real: 52000, prediccion: 51800, confianza: 94 },
  { month: "Mar", real: 48000, prediccion: 49500, confianza: 93 },
  { month: "Abr", real: 61000, prediccion: 59800, confianza: 92 },
  { month: "May", real: 55000, prediccion: 56200, confianza: 91 },
  { month: "Jun", real: null, prediccion: 63500, confianza: 88 },
  { month: "Jul", real: null, prediccion: 68200, confianza: 85 },
  { month: "Ago", real: null, prediccion: 71800, confianza: 82 },
]

// Predicción de demanda por producto
const demandPredictionData = [
  { producto: "Laptop Pro", demandaActual: 120, demandaPredicha: 185, cambio: 54 },
  { producto: "Mouse Gamer", demandaActual: 340, demandaPredicha: 298, cambio: -12 },
  { producto: "Teclado RGB", demandaActual: 280, demandaPredicha: 356, cambio: 27 },
  { producto: "Monitor 4K", demandaActual: 95, demandaPredicha: 142, cambio: 49 },
  { producto: "Webcam HD", demandaActual: 210, demandaPredicha: 189, cambio: -10 },
]

// Predicciones de tendencias
const trendPredictions = [
  {
    title: "Aumento en Electrónica",
    description: "Se predice un incremento del 34% en ventas de electrónica para el próximo trimestre",
    impact: "high",
    confidence: 89,
    icon: TrendingUp,
  },
  {
    title: "Caída en Accesorios",
    description: "Posible disminución del 15% en accesorios básicos debido a saturación del mercado",
    impact: "medium",
    confidence: 76,
    icon: TrendingDown,
  },
  {
    title: "Alerta de Inventario",
    description: "3 productos alcanzarán stock crítico en las próximas 2 semanas según proyecciones",
    impact: "high",
    confidence: 92,
    icon: AlertTriangle,
  },
  {
    title: "Oportunidad Estacional",
    description: "Temporada alta detectada: incrementar inventario de laptops y tablets en 40%",
    impact: "high",
    confidence: 85,
    icon: Sparkles,
  },
]

// Nuevos datos para gráficas adicionales
const seasonalityData = [
  { mes: "Ene", ventas: 45000, prediccion: 48000 },
  { mes: "Feb", ventas: 52000, prediccion: 54000 },
  { mes: "Mar", ventas: 48000, prediccion: 50000 },
  { mes: "Abr", ventas: 61000, prediccion: 63000 },
  { mes: "May", ventas: 55000, prediccion: 58000 },
  { mes: "Jun", ventas: 68000, prediccion: 71000 },
  { mes: "Jul", ventas: 72000, prediccion: 75000 },
  { mes: "Ago", ventas: 69000, prediccion: 72000 },
  { mes: "Sep", ventas: 58000, prediccion: 61000 },
  { mes: "Oct", ventas: 64000, prediccion: 67000 },
  { mes: "Nov", ventas: 78000, prediccion: 82000 },
  { mes: "Dic", ventas: 95000, prediccion: 98000 },
]

const categoryPerformanceData = [
  { categoria: "Electrónica", actual: 85, predicho: 92 },
  { categoria: "Ropa", actual: 72, predicho: 68 },
  { categoria: "Hogar", actual: 68, predicho: 75 },
  { categoria: "Deportes", actual: 78, predicho: 82 },
  { categoria: "Libros", actual: 65, predicho: 70 },
  { categoria: "Juguetes", actual: 80, predicho: 88 },
]

const churnPredictionData = [
  { segmento: "VIP", riesgo: 12, valor: 45000 },
  { segmento: "Frecuente", riesgo: 28, valor: 28000 },
  { segmento: "Ocasional", riesgo: 45, valor: 12000 },
  { segmento: "Nuevo", riesgo: 35, valor: 8000 },
]

const priceOptimizationData = [
  { producto: "Laptop Pro", precioActual: 1200, precioOptimo: 1350, incrementoVentas: 18 },
  { producto: "Mouse Gamer", precioActual: 45, precioOptimo: 42, incrementoVentas: 25 },
  { producto: "Teclado RGB", precioActual: 89, precioOptimo: 95, incrementoVentas: 15 },
  { producto: "Monitor 4K", precioActual: 450, precioOptimo: 425, incrementoVentas: 22 },
]

export default function PrediccionesPage() {
  const { formatPrice } = useCurrency()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Predicciones y Análisis Predictivo</h1>
            <p className="text-muted-foreground">Proyecciones basadas en IA para optimizar decisiones de negocio</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Precisión del Modelo</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">91.2%</div>
                <p className="text-xs text-muted-foreground">+2.3% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Proyectadas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(203500)}</div>
                <p className="text-xs text-muted-foreground">Próximos 3 meses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes en Riesgo</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Oportunidad de Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(34800)}</div>
                <p className="text-xs text-muted-foreground">Por optimización de precios</p>
              </CardContent>
            </Card>
          </div>

          {/* Predicción de Ventas */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between w-full">
                <div>
                  <CardTitle>Predicción de Ventas Mensuales</CardTitle>
                  <CardDescription>Comparación entre ventas reales y predicciones del modelo de IA</CardDescription>
                </div>
                <ChartInfo title="Predicción de Ventas">
                  <p className="text-sm">Compara ventas reales con lo que predice el modelo; la confianza indica la certeza de la predicción.</p>
                </ChartInfo>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  real: {
                    label: "Ventas Reales",
                    color: "hsl(var(--chart-1))",
                  },
                  prediccion: {
                    label: "Predicción IA",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesPredictionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="real"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Ventas Reales"
                    />
                    <Line
                      type="monotone"
                      dataKey="prediccion"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      name="Predicción IA"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Precisión promedio: 91%</Badge>
                <Badge variant="outline">Modelo: LSTM + Random Forest</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Predicción de Demanda por Producto */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between w-full">
                <div>
                  <CardTitle>Predicción de Demanda por Producto</CardTitle>
                  <CardDescription>Proyección de demanda para los próximos 30 días</CardDescription>
                </div>
                <ChartInfo title="Predicción de Demanda">
                  <p className="text-sm">Compara la demanda actual con la demanda predicha por producto.</p>
                </ChartInfo>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  demandaActual: {
                    label: "Demanda Actual",
                    color: "hsl(var(--chart-3))",
                  },
                  demandaPredicha: {
                    label: "Demanda Predicha",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandPredictionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="producto" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="demandaActual" fill="hsl(var(--chart-3))" name="Demanda Actual" />
                    <Bar dataKey="demandaPredicha" fill="hsl(var(--chart-4))" name="Demanda Predicha" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Predicciones de Tendencias */}
          <div className="grid gap-4 md:grid-cols-2">
            {trendPredictions.map((prediction, index) => {
              const Icon = prediction.icon
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg`}
                          style={{
                            background: prediction.impact === "high" ? `hsl(var(--brand-4) / 0.12)` : `hsl(var(--brand-1) / 0.12)`,
                          }}
                        >
                          <Icon className="h-5 w-5" style={{ color: prediction.impact === "high" ? `hsl(var(--brand-4))` : `hsl(var(--brand-1))` }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{prediction.title}</CardTitle>
                        </div>
                      </div>
                      <Badge variant={prediction.impact === "high" ? "destructive" : "secondary"}>
                        {prediction.confidence}% confianza
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{prediction.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between w-full">
                <div>
                  <CardTitle>Análisis de Estacionalidad</CardTitle>
                  <CardDescription>Patrones de ventas anuales y proyecciones</CardDescription>
                </div>
                <ChartInfo title="Análisis de Estacionalidad">
                  <p className="text-sm">Visualiza patrones estacionales y cómo la predicción se alinea con las series históricas.</p>
                </ChartInfo>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  ventas: {
                    label: "Ventas Históricas",
                    color: "hsl(var(--chart-1))",
                  },
                  prediccion: {
                    label: "Predicción",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seasonalityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                      name="Ventas Históricas"
                    />
                    <Area
                      type="monotone"
                      dataKey="prediccion"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.3}
                      strokeDasharray="5 5"
                      name="Predicción"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Categoría</CardTitle>
              <CardDescription>Análisis comparativo de desempeño actual vs predicho</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  actual: {
                    label: "Rendimiento Actual",
                    color: "hsl(var(--chart-3))",
                  },
                  predicho: {
                    label: "Rendimiento Predicho",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={categoryPerformanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="categoria" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Rendimiento Actual"
                      dataKey="actual"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Rendimiento Predicho"
                      dataKey="predicho"
                      stroke="hsl(var(--chart-4))"
                      fill="hsl(var(--chart-4))"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Predicción de Abandono de Clientes</CardTitle>
                <CardDescription>Riesgo de pérdida por segmento de cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    riesgo: {
                      label: "Riesgo de Abandono (%)",
                      color: "hsl(var(--chart-5))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={churnPredictionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segmento" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="riesgo" fill="hsl(var(--chart-5))" radius={[8, 8, 0, 0]} name="Riesgo %" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {churnPredictionData.map((item) => (
                    <div key={item.segmento} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.segmento}</span>
                      <span className="font-medium">{formatPrice(item.valor)} en riesgo</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimización de Precios</CardTitle>
                <CardDescription>Recomendaciones de ajuste de precios basadas en IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceOptimizationData.map((item) => (
                    <div key={item.producto} className="space-y-2 border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.producto}</span>
                        <Badge variant={item.precioOptimo > item.precioActual ? "default" : "secondary"}>
                          {item.precioOptimo > item.precioActual ? "Subir" : "Bajar"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Actual: {formatPrice(item.precioActual)}</span>
                        <span className="font-medium">Óptimo: {formatPrice(item.precioOptimo)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-chart-1" style={{ width: `${item.incrementoVentas}%` }} />
                        </div>
                        <span className="text-xs font-medium">+{item.incrementoVentas}% ventas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  )
}

