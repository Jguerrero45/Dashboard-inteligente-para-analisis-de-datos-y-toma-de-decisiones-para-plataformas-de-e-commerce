"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function IntegrationsSettings() {
    const [gaId, setGaId] = useState("")
    const [stripeKey, setStripeKey] = useState("")
    const [slackWebhook, setSlackWebhook] = useState("")

    return (
        <Card>
            <CardHeader>
                <CardTitle>Integraciones</CardTitle>
                <CardDescription>Conecta herramientas externas y administra claves/API.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium">Google Analytics (ID)</p>
                            <Input placeholder="G-XXXXXXX" value={gaId} onChange={(e) => setGaId(e.target.value)} />
                            <div className="mt-2 text-sm text-muted-foreground">Importa datos de tráfico y conversiones.</div>
                        </div>

                        <div>
                            <p className="font-medium">Stripe (Publishable Key)</p>
                            <Input placeholder="pk_live_..." value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} />
                            <div className="mt-2 text-sm text-muted-foreground">Sincroniza cobros y pagos.</div>
                        </div>
                    </div>

                    <div>
                        <p className="font-medium">Slack / Webhook</p>
                        <div className="mt-2 flex gap-2">
                            <Input placeholder="https://hooks.slack.com/services/..." value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} />
                            <Button onClick={() => alert("Probar webhook: " + slackWebhook)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Probar</Button>
                        </div>
                    </div>

                    <div>
                        <p className="font-medium">API Keys</p>
                        <div className="mt-2 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Key: sk_live_1234</div>
                                    <div className="text-xs text-muted-foreground">Creada: 2025-01-12 • Último uso: Hoy</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost">Revocar</Button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Crear nueva API Key</Button>
                        </div>
                    </div>

                    <div>
                        <p className="font-medium">Webhooks configurados</p>
                        <ul className="mt-2 text-sm text-muted-foreground">
                            <li>https://hooks.mi-servicio.com/orders — Pedidos</li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">Guardar integraciones</Button>
                        <Button variant="ghost">Restaurar</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
