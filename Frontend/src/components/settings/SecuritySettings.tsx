"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SecuritySettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Cambia tu contraseña y revisa la política de seguridad.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
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
                        <p className="text-sm font-medium">Política de contraseñas</p>
                        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <li>Longitud mínima: 8 caracteres</li>
                            <li>Debe incluir mayúsculas, minúsculas y números</li>
                            <li>No reutilizar las últimas 5 contraseñas</li>
                            <li>Expiración recomendada: 90 días</li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <Button>Actualizar contraseña</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
