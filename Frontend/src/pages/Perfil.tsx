"use client"

import React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import SettingsLayout from "@/components/settings/SettingsLayout"
import AccountSettings from "@/components/settings/AccountSettings"
import SecuritySettings from "@/components/settings/SecuritySettings"
import NotificationsSettings from "@/components/settings/NotificationsSettings"
import IntegrationsSettings from "@/components/settings/IntegrationsSettings"
import TeamSettings from "@/components/settings/TeamSettings"

export default function Perfil() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold">Ajustes</h1>
                        <p className="text-muted-foreground">Configura tu cuenta y preferencias del dashboard</p>
                    </div>

                    <SettingsLayout
                        sections={[
                            { key: "account", label: "Cuenta", content: <AccountSettings /> },
                            { key: "security", label: "Seguridad", content: <SecuritySettings /> },
                            { key: "notifications", label: "Notificaciones", content: <NotificationsSettings /> },
                            { key: "integrations", label: "Integraciones", content: <IntegrationsSettings /> },
                            { key: "team", label: "Equipo", content: <TeamSettings /> },
                        ]}
                    />
                </div>
            </main>

            <DashboardFooter />
        </div>
    )
}
