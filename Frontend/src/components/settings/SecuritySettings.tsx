"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function SecuritySettings() {
    const [sessions] = useState([
        { id: "s1", device: "Chrome — Linux", ip: "192.168.1.10", last: "Hoy, 09:12" },
        { id: "s2", device: "iPhone 14", ip: "192.168.1.22", last: "Ayer, 21:03" },
    ])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Contraseñas, 2FA, sesiones activas y políticas de acceso.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs">Contraseña actual</label>
                            <Input type="password" placeholder="Contraseña actual" />
                        </div>
                        <div>
                            <label className="text-xs">Nueva contraseña</label>
                            <Input type="password" placeholder="Nueva contraseña" />
                        </div>
                        <div>
                            <label className="text-xs">Confirmar nueva</label>
                            <Input type="password" placeholder="Confirmar" />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium">Autenticación de dos factores (2FA)</p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <label className="flex items-center gap-3">
                                <Input type="checkbox" />
                                <span>Aplicación de autenticación (TOTP)</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <Input type="checkbox" />
                                <span>SMS (no recomendado)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium">Sesiones activas</p>
                        <ul className="mt-2 space-y-2 text-sm">
                            {sessions.map((s) => (
                                <li key={s.id} className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{s.device}</div>
                                        <div className="text-xs text-muted-foreground">{s.ip} • {s.last}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost">Revocar</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3">
                            <Button variant="outline">Revocar todas las sesiones</Button>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium">Política de contraseñas</p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>Longitud mínima: 8 caracteres</div>
                            <div>Requerir números: Sí</div>
                            <div>Expiración: 90 días</div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium">Listas de IP / Acceso por red</p>
                        <Input placeholder="Agregar IP permitida (ej. 203.0.113.5/32)" />
                    </div>

                    <div className="flex gap-2">
                        <Button>Guardar configuración de seguridad</Button>
                        <Button variant="ghost">Restaurar por defecto</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
