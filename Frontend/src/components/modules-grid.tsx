"use client"

import { Link } from "react-router-dom"
import { BarChart3, ShoppingCart, Package, Users, FileText, Sparkles, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const modules = [
  {
    title: "Análisis de Datos",
    description: "Visualiza métricas clave y tendencias de tu negocio en tiempo real",
    icon: BarChart3,
    href: "/",
    brand: 1,
  },
  {
    title: "Gestión de Ventas",
    description: "Administra pedidos, transacciones y seguimiento de ventas",
    icon: ShoppingCart,
    href: "/ventas",
    brand: 2,
  },
  {
    title: "Productos",
    description: "Control de inventario, categorías y gestión de catálogo",
    icon: Package,
    href: "/productos",
    brand: 3,
  },
  {
    title: "Clientes",
    description: "Base de datos de clientes, segmentación y análisis de comportamiento",
    icon: Users,
    href: "/clientes",
    brand: 4,
  },
  {
    title: "Reportes",
    description: "Genera reportes personalizados y exporta datos en múltiples formatos",
    icon: FileText,
    href: "/reportes",
    brand: 5,
  },
  {
    title: "Recomendaciones IA",
    description: "Análisis inteligente con sugerencias de marketing y toma de decisiones",
    icon: Sparkles,
    href: "/ia-recomendaciones",
    brand: 6,
  },
  {
    title: "Predicciones",
    description: "Proyecciones de ventas y tendencias basadas en datos históricos",
    icon: TrendingUp,
    href: "/predicciones",
    brand: 7,
  },
  {
    title: "Finanzas",
    description: "Análisis monetario: ingresos, costos, ganancias y márgenes",
    icon: DollarSign,
    href: "/finanzas",
    brand: 8,
  },
]

export function ModulesGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {modules.map((module) => {
        const Icon = module.icon
        return (
          <Link key={module.title} to={module.href}>
            <Card className="group h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
                  style={{
                    background: `hsl(var(--brand-${module.brand}) / 0.12)`,
                  }}
                >
                  <Icon className={`h-6 w-6`} style={{ color: `hsl(var(--brand-${module.brand}))` }} />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{module.title}</CardTitle>
                <CardDescription className="text-pretty">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary group-hover:underline">Acceder →</span>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
