import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
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
  const dashboardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const embed = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embed") === "1"

  const handleExport = async (format: "png" | "pdf") => {
    if (!dashboardRef.current) return
    const node = dashboardRef.current
    const backgroundColor =
      getComputedStyle(node).backgroundColor ||
      getComputedStyle(document.body).backgroundColor ||
      "#0b1221"
    try {
      setExporting(true)
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        windowWidth: document.documentElement.scrollWidth,
        backgroundColor,
      })
      const imgData = canvas.toDataURL("image/png")

      if (format === "png") {
        const link = document.createElement("a")
        link.href = imgData
        link.download = "dashboard.png"
        link.click()
        return
      }

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "l" : "p",
        unit: "px",
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
      pdf.save("dashboard.pdf")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!embed && <DashboardHeader />}

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6" data-html2canvas-ignore="true">
          <div>
            <h1 className="text-4xl font-bold text-balance mb-2">Dashboard Inteligente</h1>
            <p className="text-muted-foreground text-pretty">
              Análisis de datos y toma de decisiones para tu e-commerce
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow hover:bg-secondary/90 disabled:opacity-60"
            >
              {exporting ? "Exportando…" : "Exportar PDF"}
            </button>
          </div>
        </div>

        <div ref={dashboardRef} className="space-y-8 bg-background">
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

      {!embed && <DashboardFooter />}
    </div>
  )
}