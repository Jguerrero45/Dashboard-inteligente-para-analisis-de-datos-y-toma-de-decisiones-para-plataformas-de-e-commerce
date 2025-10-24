"use client"

import { Link } from "react-router-dom"
import { BarChart3, ShoppingCart, Package, Users, FileText, Database, Sparkles, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const modules = [
  {
    title: "Análisis de Datos",
    description: "Visualiza métricas clave y tendencias de tu negocio en tiempo real",
    icon: BarChart3,
    href: "/",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Gestión de Ventas",
    description: "Administra pedidos, transacciones y seguimiento de ventas",
    icon: ShoppingCart,
    href: "/ventas",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Productos",
    description: "Control de inventario, categorías y gestión de catálogo",
    icon: Package,
    href: "/productos",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Clientes",
    description: "Base de datos de clientes, segmentación y análisis de comportamiento",
    icon: Users,
    href: "/clientes",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Reportes",
    description: "Genera reportes personalizados y exporta datos en múltiples formatos",
    icon: FileText,
    href: "/reportes",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "Base de Datos",
    description: "Gestión y configuración de la base de datos PostgreSQL",
    icon: Database,
    href: "/base-datos",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    title: "Recomendaciones IA",
    description: "Análisis inteligente con sugerencias de marketing y toma de decisiones",
    icon: Sparkles,
    href: "/ia-recomendaciones",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    title: "Predicciones",
    description: "Proyecciones de ventas y tendencias basadas en datos históricos",
    icon: TrendingUp,
    href: "/predicciones",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
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
                <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
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
