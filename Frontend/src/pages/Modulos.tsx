import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { ModulesGrid } from "@/components/modules-grid"

export default function Modulos() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-balance mb-2">Módulos del Sistema</h1>
            <p className="text-muted-foreground text-pretty">Accede a todas las funcionalidades del dashboard</p>
          </div>

          <ModulesGrid />
        </div>
      </main>

      <DashboardFooter />
    </div>
  )
}
