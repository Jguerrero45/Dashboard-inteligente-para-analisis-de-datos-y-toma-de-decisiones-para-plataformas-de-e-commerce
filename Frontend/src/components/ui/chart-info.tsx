"use client"

import React from "react"
import Popover, { PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChartInfo({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`Información sobre ${title}`}
                    className="ml-2 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium hover:bg-muted"
                >
                    i
                </button>
            </PopoverTrigger>
            <PopoverContent>
                <Card>
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                    </CardHeader>
                    <CardContent>{children}</CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    )
}
