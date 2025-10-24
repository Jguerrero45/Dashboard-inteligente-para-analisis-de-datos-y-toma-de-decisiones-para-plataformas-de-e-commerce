"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

export function MetricsCards() {
  const { formatPrice } = useCurrency()

  const metrics = [
    {
      title: "Ventas Totales",
      value: formatPrice(45231.89),
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Pedidos",
      value: "1,234",
      change: "+12.5%",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Clientes Activos",
      value: "892",
      change: "+8.2%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Productos Vendidos",
      value: "3,456",
      change: "-3.1%",
      trend: "down",
      icon: Package,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                <TrendIcon
                  className={`h-3 w-3 ${metric.trend === "up" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                />
                <span
                  className={
                    metric.trend === "up" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                  }
                >
                  {metric.change}
                </span>
                <span className="text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
