"use client"

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { useCurrency } from "@/hooks/use-currency"

export default function AccountSettings() {
    const { currency } = useCurrency()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cuenta</CardTitle>
                <CardDescription>Información completa de perfil, datos fiscales y preferencias personales.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs">Nombre completo</label>
                        <Input placeholder="Nombre completo" defaultValue="Admin Dashboard" />
                    </div>

                    <div>
                        <label className="text-xs">Nombre de usuario</label>
                        <Input placeholder="usuario" defaultValue="admin" />
                    </div>

                    <div>
                        <label className="text-xs">Email</label>
                        <Input placeholder="correo@ejemplo.com" defaultValue="admin@ecommerce.com" />
                    </div>

                    <div>
                        <label className="text-xs">Teléfono</label>
                        <Input placeholder="+58 412 0000000" />
                    </div>

                    <div>
                        <label className="text-xs">Empresa</label>
                        <Input placeholder="Nombre de la empresa" defaultValue="Mi Tienda" />
                    </div>

                    <div>
                        <label className="text-xs">Dirección fiscal</label>
                        <Input placeholder="Calle, Ciudad, País" />
                    </div>

                    <div>
                        <label className="text-xs">NIT / RIF</label>
                        <Input placeholder="Identificador fiscal" />
                    </div>

                    <div>
                        <label className="text-xs">Website / Perfil público</label>
                        <Input placeholder="https://" />
                    </div>

                    <div>
                        <label className="text-xs">Moneda por defecto</label>
                        <Select defaultValue={currency}>
                            <SelectTrigger className="w-full">{currency}</SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="VES">Bs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs">Biografía / Nota</label>
                        <Input placeholder="Descripción breve del negocio" />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <Button>Guardar cambios</Button>
                    <Button variant="ghost">Exportar perfil (JSON)</Button>
                </div>
            </CardContent>
        </Card>
    )
}
