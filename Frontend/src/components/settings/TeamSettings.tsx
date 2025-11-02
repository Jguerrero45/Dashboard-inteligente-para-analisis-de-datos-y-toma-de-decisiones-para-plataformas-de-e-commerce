"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TeamSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Equipo</CardTitle>
                <CardDescription>Gestiona miembros del equipo, permisos y roles.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input placeholder="Agregar miembro (email)" />
                        <Input placeholder="Rol (Admin / Editor / Viewer)" />
                        <Input placeholder="Permisos (comma separated)" />
                        <Button>Invitar</Button>
                    </div>

                    <div>
                        <p className="font-medium">Miembros actuales</p>
                        <div className="mt-2 border rounded-md p-3 text-sm">
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <div className="font-medium">admin@ecommerce.com</div>
                                    <div className="text-xs text-muted-foreground">Role: Admin • Último acceso: Hoy</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost">Editar</Button>
                                    <Button variant="ghost">Remover</Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <div className="font-medium">user1@ecommerce.com</div>
                                    <div className="text-xs text-muted-foreground">Role: Editor • Último acceso: 2025-10-28</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost">Editar</Button>
                                    <Button variant="ghost">Remover</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="font-medium">Roles y permisos</p>
                        <ul className="mt-2 text-sm text-muted-foreground">
                            <li>Admin — Acceso total, gestión de facturación y usuarios</li>
                            <li>Editor — Gestiona productos y reportes</li>
                            <li>Viewer — Solo visualización</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
