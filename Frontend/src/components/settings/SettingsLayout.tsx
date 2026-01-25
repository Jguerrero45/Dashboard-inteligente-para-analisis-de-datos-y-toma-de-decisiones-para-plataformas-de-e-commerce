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
        <div className="w-full py-4">
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex gap-2 justify-center">
                            {sections.map((s) => (
                                <Button
                                    key={s.key}
                                    variant={s.key === active ? "secondary" : "outline"}
                                    onClick={() => setActive(s.key)}
                                    className="whitespace-nowrap text-sm"
                                >
                                    {s.label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <section className="mt-4">
                    <div className="space-y-4">{activeSection?.content}</div>
                </section>
            </div>
        </div>
    )
}
