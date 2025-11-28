"use client"

import { Navigate } from "react-router-dom"

// Módulo Finanzas eliminado: redirigimos a dashboard si alguien intenta acceder.
export default function FinanzasPage() {
    return <Navigate to="/dashboard" replace />
}
