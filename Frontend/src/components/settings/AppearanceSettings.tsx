"use client"

import React, { useEffect, useLayoutEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { applyRootFontSize } from "@/lib/font-size"

const SIZE_LABEL: Record<string, string> = { sm: "Pequeño", md: "Medio", lg: "Grande" }
const THEME_LABEL: Record<string, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" }

export default function AppearanceSettings() {
    const { theme, setTheme } = useTheme()
    const [fontSize, setFontSize] = useState<string>("md")

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            applyRootFontSize(fontSize || "md")
        }
    }, [])

    useLayoutEffect(() => {
        if (fontSize) {
            applyRootFontSize(fontSize)
        }
    }, [fontSize])

    useEffect(() => {
        let mounted = true
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
        if (!token) return
        fetch('/api/profile/', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (!mounted || !data) return
                const size = data.font_size || "md"
                setFontSize(size)
                applyRootFontSize(size)
            })
            .catch(() => { })
        return () => { mounted = false }
    }, [])

    const restoreDefaults = () => {
        setFontSize("md")
        setTheme("system")
        applyRootFontSize("md")
    }

    const saveSettings = async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
        if (!token) return
        try {
            await fetch('/api/profile/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ font_size: fontSize }),
            })
            window.alert("Cambios guardados exitosamente")
        } catch (_e) {
            window.alert("No se pudo guardar el tamaño de fuente")
        }
    }

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
                            <SelectTrigger className="w-full">{THEME_LABEL[theme] ?? "Claro"}</SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Oscuro</SelectItem>
                                <SelectItem value="system">Sistema</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-xs">Tamaño de fuente</label>
                        <Select defaultValue={fontSize} onValueChange={(v) => setFontSize(v)}>
                            <SelectTrigger className="w-full">{SIZE_LABEL[fontSize] ?? "Grande"}</SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sm">Pequeño</SelectItem>
                                <SelectItem value="md">Medio</SelectItem>
                                <SelectItem value="lg">Grande</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <Button variant="secondary" onClick={saveSettings}>
                        Guardar
                    </Button>
                    <Button variant="ghost" onClick={restoreDefaults}>
                        Restaurar por defecto
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
