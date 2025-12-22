import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { MetricsCards } from "@/components/metrics-cards"
import { SalesChart } from "@/components/charts/sales-chart"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { ProductsChart } from "@/components/charts/products-chart"
import { CustomersChart } from "@/components/charts/customers-chart"
// Conversion and Traffic charts removed per request
import { TopProductsChart } from "@/components/charts/top-products-chart"
import { SalesHeatmap } from "@/components/charts/sales-heatmap"
import { OrdersChart } from "@/components/charts/orders-chart"
import { ReturningCustomersCard } from "@/components/charts/returning-customers-card"
import { MarginByCategoryChart } from "@/components/charts/margin-by-category-chart"
import { CategoryPerformanceRadar } from "@/components/charts/category-performance-radar"

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-balance mb-2">Dashboard Inteligente</h1>
            <p className="text-muted-foreground text-pretty">
              Análisis de datos y toma de decisiones para tu e-commerce
            </p>
          </div>

          <MetricsCards />


          <div className="grid gap-6 md:grid-cols-2">
            <SalesChart />
            <RevenueChart />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <OrdersChart />
            <ReturningCustomersCard />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <MarginByCategoryChart />
            <CategoryPerformanceRadar />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ProductsChart />
            <CustomersChart />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TopProductsChart />
            <SalesHeatmap />
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  )
}
