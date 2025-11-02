"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Section {
    key: string
    label: string
    content: React.ReactNode
}

export default function SettingsLayout({ sections }: { sections: Section[] }) {
    const [active, setActive] = useState(sections[0]?.key ?? "")

    const activeSection = sections.find((s) => s.key === active) ?? sections[0]

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
                <Card>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold">Ajustes</p>
                            <p className="text-xs text-muted-foreground">Gestiona tu cuenta y preferencias del dashboard</p>

                            <div className="mt-4 space-y-1">
                                {sections.map((s) => (
                                    <Button
                                        key={s.key}
                                        variant={s.key === active ? "secondary" : "ghost"}
                                        onClick={() => setActive(s.key)}
                                        className="w-full justify-start text-sm"
                                    >
                                        {s.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </aside>

            <section className="md:col-span-3">
                <div className="space-y-4">{activeSection?.content}</div>
            </section>
        </div>
    )
}
