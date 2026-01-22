"use client"

import { Link } from "react-router-dom"
import { BarChart3, Package, Users, FileText, Sparkles, DollarSign, Calculator, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const modules = [
  {
    title: "Análisis de Datos",
    description: "Visualiza métricas clave y tendencias de tu negocio en tiempo real",
    icon: BarChart3,
    href: "/dashboard",
    brand: 1,
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
    title: "Ventas",
    description: "Resumen de ventas, facturación y tendencias",
    icon: DollarSign,
    href: "/ventas",
    brand: 2,
  },
  {
    title: "Costos",
    description: "Control y análisis de costos por categoría y centro de costo",
    icon: Calculator,
    href: "/costos",
    brand: 7,
  },
  {
    title: "Próximamente",
    description: "Nuevo módulo en desarrollo",
    icon: Clock,
    href: "",
    brand: 8,
    comingSoon: true,
  },
]

export function ModulesGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {modules.map((module) => {
        const Icon = module.icon
        const content = (
          <Card className={`group h-full transition-all hover:shadow-lg hover:scale-105 ${module.comingSoon ? 'opacity-80' : 'cursor-pointer'}`}>
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
              {module.comingSoon ? (
                <span className="text-sm font-medium text-muted-foreground">Próximamente</span>
              ) : (
                <span
                  className="inline-block text-sm font-medium text-white px-3 py-1 rounded"
                  style={{ background: `hsl(var(--brand-${module.brand}))` }}
                >
                  Acceder →
                </span>
              )}
            </CardContent>
          </Card>
        )

        return module.comingSoon ? (
          <div key={module.title}>
            {content}
          </div>
        ) : (
          <Link key={module.title} to={module.href}>
            {content}
          </Link>
        )
      })}
    </div>
  )
}
