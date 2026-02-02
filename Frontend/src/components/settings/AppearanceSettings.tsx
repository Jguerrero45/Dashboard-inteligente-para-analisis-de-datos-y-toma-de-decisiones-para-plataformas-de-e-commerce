"use client"

import React, { useEffect, useLayoutEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

const SIZE_MAP: Record<string, number> = { sm: 14, md: 16, lg: 18 }
const SIZE_LABEL: Record<string, string> = { sm: "Pequeño", md: "Medio", lg: "Grande" }
const THEME_LABEL: Record<string, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" }

export default function AppearanceSettings() {
    const { theme, setTheme } = useTheme()
    const [fontSize, setFontSize] = useState<string>("md")

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("app:fontSize") ?? "md"
            const px = SIZE_MAP[saved] ?? 16
            document.documentElement.style.setProperty("--root-font-size", `${px}px`)
            document.documentElement.style.fontSize = `${px}px`
            setFontSize(saved)
        }
    }, [])

    useLayoutEffect(() => {
        if (fontSize) {
            const px = SIZE_MAP[fontSize] ?? 16
            if (typeof document !== "undefined") {
                document.documentElement.style.setProperty("--root-font-size", `${px}px`)
                document.documentElement.style.fontSize = `${px}px`
            }
        }
    }, [fontSize])

    useEffect(() => {
        if (typeof window !== "undefined" && fontSize) {
            localStorage.setItem("app:fontSize", fontSize)
        }
    }, [fontSize])

    const restoreDefaults = () => {
        setFontSize("md")
        setTheme("system")
        if (typeof window !== "undefined") localStorage.removeItem("app:fontSize")
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
                    <Button variant="secondary" onClick={() => {
                        window.alert("Cambios guardados exitosamente")
                    }}>
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
