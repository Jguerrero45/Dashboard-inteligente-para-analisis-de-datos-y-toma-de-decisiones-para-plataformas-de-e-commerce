import React from "react"
import { Tooltip } from "recharts"

export function ChartContainer({ children, className, config }: { children: React.ReactNode; className?: string; config?: any }) {
    // `config` se acepta para compatibilidad con las llamadas existentes desde los charts.
    // Actualmente no se utiliza directamente aquí, pero se deja disponible para futuras mejoras.
    void config
    return <div className={className}>{children}</div>
}

export function ChartTooltip(props: any) {
    return <Tooltip {...props} />
}

export function ChartTooltipContent({ active, payload }: any) {
    if (!active || !payload || !payload.length) return null
    return (
        <div className="bg-background border p-2 rounded shadow">
            {payload.map((item: any, i: number) => {
                // Try to derive a color from the payload (fill/stroke/color) falling back to the primary color
                const color = item.color || item.fill || item.stroke || (item.payload && item.payload.fill) || 'hsl(var(--color-primary))'
                const label = item.name ?? item.dataKey ?? ''
                const value = item.value ?? (item.payload && item.payload[item.dataKey]) ?? ''
                return (
                    <div key={i} className="flex items-center gap-2 py-1">
                        <span style={{ width: 10, height: 10, borderRadius: 6, display: 'inline-block', background: color }} />
                        <div className="text-sm font-medium" style={{ color }}>{label}</div>
                        <div className="text-xs text-muted-foreground ml-2" style={{ color }}>{value}</div>
                    </div>
                )
            })}
        </div>
    )
}
