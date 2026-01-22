"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import SettingsLayout from "@/components/settings/SettingsLayout"
import AccountSettings from "@/components/settings/AccountSettings"
import SecuritySettings from "@/components/settings/SecuritySettings"
import StoreSettings from "@/components/settings/StoreSettings"

export default function Perfil() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Cuenta y seguridad</h1>
                        <p className="text-muted-foreground">Administra los datos de tu cuenta y la seguridad del acceso</p>
                    </div>

                    <SettingsLayout
                        sections={[
                            { key: "account", label: "Cuenta", content: <AccountSettings /> },
                            { key: "security", label: "Seguridad", content: <SecuritySettings /> },
                            { key: "store", label: "Tienda", content: <StoreSettings /> },
                        ]}
                    />
                </div>
            </main>

            <DashboardFooter />
        </div>
    )
}
