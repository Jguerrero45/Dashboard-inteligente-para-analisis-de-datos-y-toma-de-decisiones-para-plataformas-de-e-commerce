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
import { getApiBase } from "@/lib/activeStore"

type ExportSectionId =
  | "metrics"
  | "sales"
  | "revenue"
  | "orders"
  | "returning"
  | "margin"
  | "category"
  | "products"
  | "customers"
  | "topProducts"
  | "heatmap"

const EXPORT_SECTIONS: { id: ExportSectionId; label: string }[] = [
  { id: "metrics", label: "Resumen de métricas" },
  { id: "sales", label: "Ventas Anuales" },
  { id: "revenue", label: "Ingresos por Categoría" },
  { id: "orders", label: "Cantidad de Pedidos Anuales" },
  { id: "returning", label: "% de clientes que regresan" },
  { id: "margin", label: "Margen por Categoría" },
  { id: "category", label: "Rendimiento por Categoría" },
  { id: "products", label: "Distribución de Productos" },
  { id: "customers", label: "Mejores clientes" },
  { id: "topProducts", label: "Productos Más Vendidos" },
  { id: "heatmap", label: "Mapa de Calor de Ventas" },
]

export default function Dashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedSections, setSelectedSections] = useState<ExportSectionId[]>(
    EXPORT_SECTIONS.map((section) => section.id)
  )
  const embed = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embed") === "1"
  const API_BASE = getApiBase()

  const handleExport = async (format: "png" | "pdf") => {
    const node = exportRef.current || dashboardRef.current
    if (!node) return
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

  const toggleSection = (id: ExportSectionId) => {
    setSelectedSections((current) =>
      current.includes(id) ? current.filter((sectionId) => sectionId !== id) : [...current, id]
    )
  }

  const isSelected = (id: ExportSectionId) => selectedSections.includes(id)
  const selectAll = () => setSelectedSections(EXPORT_SECTIONS.map((section) => section.id))
  const clearAll = () => setSelectedSections([])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!embed && <DashboardHeader />}

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6" data-html2canvas-ignore="true">
          <div>
            <h1 className="text-4xl font-bold text-balance mb-2">Dashboard Inteligente</h1>
            <p className="text-muted-foreground text-pretty">
              Análisis de datos y toma de decisiones para tu e-commerce.
            </p>
            <div className="text-sm text-muted-foreground">API Base: {API_BASE}</div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
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

        <div
          ref={exportRef}
          className="pointer-events-none absolute left-[-9999px] top-0 w-[1400px] space-y-8 bg-background"
          aria-hidden
        >
          {isSelected("metrics") && <MetricsCards />}

          {(isSelected("sales") || isSelected("revenue")) && (
            <div className="grid gap-6 md:grid-cols-2">
              {isSelected("sales") && <SalesChart />}
              {isSelected("revenue") && <RevenueChart />}
            </div>
          )}

          {(isSelected("orders") || isSelected("returning")) && (
            <div className="grid gap-6 md:grid-cols-2">
              {isSelected("orders") && <OrdersChart />}
              {isSelected("returning") && <ReturningCustomersCard />}
            </div>
          )}

          {(isSelected("margin") || isSelected("category")) && (
            <div className="grid gap-6 md:grid-cols-2">
              {isSelected("margin") && <MarginByCategoryChart />}
              {isSelected("category") && <CategoryPerformanceRadar />}
            </div>
          )}

          {(isSelected("products") || isSelected("customers")) && (
            <div className="grid gap-6 md:grid-cols-2">
              {isSelected("products") && <ProductsChart />}
              {isSelected("customers") && <CustomersChart />}
            </div>
          )}

          {(isSelected("topProducts") || isSelected("heatmap")) && (
            <div className="grid gap-6 md:grid-cols-2">
              {isSelected("topProducts") && <TopProductsChart />}
              {isSelected("heatmap") && <SalesHeatmap />}
            </div>
          )}
        </div>
      </main>

      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Exportar PDF"
          data-html2canvas-ignore="true"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur">
            <div className="border-b border-border/60 p-4">
              <h2 className="text-lg font-semibold">Exportar PDF</h2>
              <p className="text-sm text-muted-foreground">Elige los gráficos que quieres incluir.</p>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-xs text-muted-foreground">
                  {selectedSections.length} de {EXPORT_SECTIONS.length} seleccionados
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-accent"
                  >
                    Seleccionar todo
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-accent"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                {EXPORT_SECTIONS.map((section) => (
                  <label
                    key={section.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 transition hover:border-primary/60 hover:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary"
                      checked={isSelected(section.id)}
                      onChange={() => toggleSection(section.id)}
                    />
                    <span className="font-medium text-foreground/90">{section.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 p-4">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-accent"
                disabled={exporting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleExport("pdf")
                  setExportModalOpen(false)
                }}
                disabled={exporting || selectedSections.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
              >
                {exporting ? "Exportando…" : "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!embed && <DashboardFooter />}
    </div>
  )
}