"use client"

import React from "react"
import { Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

export function ChartContainer({ children, className, config }: { children: React.ReactNode; className?: string; config?: any }) {
    // `config` se acepta para compatibilidad con las llamadas existentes desde los charts.
    // Si el hijo ya es un <ResponsiveContainer> lo dejamos pasar, si no lo envolvemos
    // para asegurar que Recharts tenga un tamaño definido y las gráficas se rendericen.
    void config

    // Si hay un único elemento React y su tipo es ResponsiveContainer, lo devolvemos tal cual.
    if (React.isValidElement(children) && (children as any).type === ResponsiveContainer) {
        return <div className={className}>{children}</div>
    }

    // Envolvemos el contenido en ResponsiveContainer para que ocupe el 100% del contenedor.
    return (
        <div className={className}>
            <ResponsiveContainer width="100%" height="100%">
                {children as any}
            </ResponsiveContainer>
        </div>
    )
}

export function ChartTooltip({ content, data, fallbackIndex = 0, ...rest }: any) {
    // Simplified wrapper: forward props to Recharts' Tooltip and let Recharts
    // manage active/index state. If a custom `content` is provided, pass it
    // through; otherwise use the default renderer.
    // Determine an effective defaultIndex:
    // - prefer an explicitly passed `defaultIndex` in props
    // - else use `fallbackIndex` provided by callers
    // - else if `data` is an array, use the last item
    const effectiveDefaultIndex = typeof rest.defaultIndex === 'number'
        ? rest.defaultIndex
        : (typeof fallbackIndex === 'number' ? fallbackIndex : (Array.isArray(data) ? Math.max(0, data.length - 1) : 0))

    // Provide a `key` that changes when data length or effective index changes so
    // Recharts will remount the Tooltip and apply `defaultIndex` when async data arrives.
    const key = `tooltip-${effectiveDefaultIndex}-${Array.isArray(data) ? data.length : 0}`

    return <RechartsTooltip key={key} {...rest} defaultIndex={effectiveDefaultIndex} content={content} />
}

// Export a `Tooltip` alias so callers can import `Tooltip` from this module
export const Tooltip = ChartTooltip

export function renderTooltipWithoutRange(props: any) {
    if (props && props.active && props.payload && props.payload.length) return <ChartTooltipContent {...props} />
    return null
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
