"use client"

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function NotificationsSettings() {
    const [webhook, setWebhook] = useState("")

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Controla notificaciones por evento, canal y frecuencia.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium">Eventos críticos</p>
                            <p className="text-sm text-muted-foreground">Errores del sistema, fallos de pago y alertas de seguridad.</p>
                            <div className="mt-2 space-y-2 text-sm">
                                <label className="flex items-center gap-3"><Input type="checkbox" defaultChecked /> Pago fallido</label>
                                <label className="flex items-center gap-3"><Input type="checkbox" defaultChecked /> Errores del sistema</label>
                                <label className="flex items-center gap-3"><Input type="checkbox" /> Alertas de seguridad</label>
                            </div>
                        </div>

                        <div>
                            <p className="font-medium">Canales</p>
                            <p className="text-sm text-muted-foreground">Correo, App y Webhooks</p>
                            <div className="mt-2 space-y-2 text-sm">
                                <label className="flex items-center gap-3"><Input type="checkbox" defaultChecked /> Email</label>
                                <label className="flex items-center gap-3"><Input type="checkbox" defaultChecked /> In-App</label>
                                <label className="flex items-center gap-3"><Input type="checkbox" /> SMS</label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="font-medium">Digest / Frecuencia</p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input placeholder="Diario / Semanal / Mensual" />
                            <Input placeholder="Hora preferida (HH:mm)" />
                            <Input placeholder="Zona horaria" />
                        </div>
                    </div>

                    <div>
                        <p className="font-medium">Webhook de notificaciones</p>
                        <p className="text-sm text-muted-foreground">URL donde enviar eventos (JSON POST)</p>
                        <div className="mt-2 flex gap-2">
                            <Input placeholder="https://hooks.tu-servicio.com/notify" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
                            <Button onClick={() => alert("Simular envío a: " + webhook)}>Probar</Button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button>Guardar preferencias</Button>
                        <Button variant="ghost">Restaurar</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
