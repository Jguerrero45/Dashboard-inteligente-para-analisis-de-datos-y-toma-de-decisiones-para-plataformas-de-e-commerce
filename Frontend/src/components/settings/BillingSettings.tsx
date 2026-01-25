"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function BillingSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Facturación</CardTitle>
                <CardDescription>Gestiona métodos de pago, facturas y plan de suscripción.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs">Método de pago</label>
                        <Input placeholder="Número de tarjeta" />
                    </div>

                    <div>
                        <label className="text-xs">Nombre en la tarjeta</label>
                        <Input placeholder="Nombre tal como aparece" />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <Button variant="secondary">Actualizar método</Button>
                    <Button variant="ghost">Ver facturas</Button>
                </div>
            </CardContent>
        </Card>
    )
}
