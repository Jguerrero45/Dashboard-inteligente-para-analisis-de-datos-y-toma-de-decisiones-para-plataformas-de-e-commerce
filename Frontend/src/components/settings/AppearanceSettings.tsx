"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

export default function AppearanceSettings() {
    const { theme, setTheme } = useTheme()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>Ajusta tema, tamaño de fuente y preferencias visuales.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs">Tema</label>
                        <Select defaultValue={theme ?? "light"} onValueChange={(v) => setTheme(v)}>
                            <SelectTrigger className="w-full">{theme}</SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Oscuro</SelectItem>
                                <SelectItem value="system">Sistema</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-xs">Tamaño de fuente</label>
                        <Select defaultValue="md">
                            <SelectTrigger className="w-full">Medio</SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sm">Pequeño</SelectItem>
                                <SelectItem value="md">Medio</SelectItem>
                                <SelectItem value="lg">Grande</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">Aplicar</Button>
                    <Button variant="ghost">Restaurar por defecto</Button>
                </div>
            </CardContent>
        </Card>
    )
}
