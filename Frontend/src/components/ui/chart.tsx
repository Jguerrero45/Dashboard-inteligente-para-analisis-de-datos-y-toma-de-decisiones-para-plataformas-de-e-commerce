import React from "react"
import { Tooltip } from "recharts"

export function ChartContainer({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>
}

export function ChartTooltip(props: any) {
    return <Tooltip {...props} />
}

export function ChartTooltipContent({ active, payload }: any) {
    if (!active || !payload || !payload.length) return null
    const item = payload[0]
    return (
        <div className="bg-background border p-2 rounded shadow">
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.value}</div>
        </div>
    )
}
