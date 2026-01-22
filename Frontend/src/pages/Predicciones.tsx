"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"

export default function PrediccionesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-bold">Predicciones</h1>
          <p className="text-muted-foreground">La página de predicciones está temporalmente deshabilitada.</p>
        </div>
      </main>
      <DashboardFooter />
    </div>
  )
}

