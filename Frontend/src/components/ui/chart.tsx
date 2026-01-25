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

    // If a `wrapperStyle` was provided to the Tooltip, inject it into the
    // content renderer props. Recharts does apply `wrapperStyle` to its outer
    // wrapper, but custom `content` renderers often render their own root
    // element and won't pick up that style unless we forward it.

    // Resolve CSS variables (e.g. `var(--color-background)`) to concrete colors
    // so Recharts' wrapper div receives a usable background instead of an
    // unresolved `var(...)` string which sometimes doesn't render depending
    // on scope. This runs only in the browser.
    const resolveValue = (val: any) => {
        if (!val || typeof val !== 'string') return val
        const m = val.match(/var\((--[\w-]+)\)/)
        if (!m) return val
        try {
            if (typeof window !== 'undefined' && window.getComputedStyle) {
                const docStyle = getComputedStyle(document.documentElement)
                const computed = docStyle.getPropertyValue(m[1])
                const trimmed = (computed || '').trim()
                if (!trimmed) return val
                // If the custom property contains HSL triplet parts (e.g. "0 0% 90%"), wrap it
                // with `hsl(...)` so it becomes a valid color string.
                if (/^\s*\d+(?:\.\d+)?\s+\d+%?\s+\d+%?\s*$/.test(trimmed)) {
                    return `hsl(${trimmed})`
                }
                return trimmed
            }
        } catch (e) {
            return val
        }
        return val
    }

    const resolvedWrapperStyle: any = {}
    if (rest && rest.wrapperStyle) {
        for (const k of Object.keys(rest.wrapperStyle)) {
            resolvedWrapperStyle[k] = resolveValue(rest.wrapperStyle[k])
        }
    }

    // As a last-resort, prefer the computed `background-color` and `color`
    // from the document body to ensure the tooltip background is a solid
    // rendered color (e.g. `rgb(...)`) rather than a CSS variable or color
    // function that may not paint in this context.
    try {
        if (typeof window !== 'undefined' && window.getComputedStyle) {
            const bodyStyle = getComputedStyle(document.body)
            // Prefer any provided `background` or `backgroundColor` (resolve both),
            // then fall back to the document body styles to ensure a solid color.
            if (!resolvedWrapperStyle.background && resolvedWrapperStyle.backgroundColor) resolvedWrapperStyle.background = resolvedWrapperStyle.backgroundColor
            if (!resolvedWrapperStyle.background) resolvedWrapperStyle.background = bodyStyle.backgroundColor || resolvedWrapperStyle.background
            if (!resolvedWrapperStyle.backgroundColor) resolvedWrapperStyle.backgroundColor = resolvedWrapperStyle.background
            if (!resolvedWrapperStyle.color) resolvedWrapperStyle.color = bodyStyle.color || resolvedWrapperStyle.color
            if (!resolvedWrapperStyle.opacity && resolvedWrapperStyle.opacity !== 0) resolvedWrapperStyle.opacity = resolvedWrapperStyle.opacity ?? 1
        }
    } catch (e) {
        // ignore
    }

    // Ensure the wrapper background is fully opaque: convert `rgba()`/`hsla()` with alpha
    // to non-alpha equivalents and force opacity to 1 so the tooltip box renders solid.
    const makeOpaque = (col: string) => {
        if (!col || typeof col !== 'string') return col
        const rgba = col.match(/rgba?\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)(?:,(\s*(0|0?\.\d+|1(?:\.0+)? )\s*))?\)/i)
        if (rgba) {
            return `rgb(${rgba[1].trim()}, ${rgba[2].trim()}, ${rgba[3].trim()})`
        }
        const hsla = col.match(/hsla?\(([^,]+),([^,]+),([^,\)]+)(?:,([\d\.]+))?\)/i)
        if (hsla) {
            return `hsl(${hsla[1].trim()}, ${hsla[2].trim()}, ${hsla[3].trim()})`
        }
        if (col.trim() === 'transparent') return resolvedWrapperStyle.background || 'rgb(255,255,255)'
        return col
    }

    if (resolvedWrapperStyle.background) resolvedWrapperStyle.background = makeOpaque(resolveValue(resolvedWrapperStyle.background))
    if (resolvedWrapperStyle.backgroundColor) resolvedWrapperStyle.backgroundColor = makeOpaque(resolveValue(resolvedWrapperStyle.backgroundColor))
    resolvedWrapperStyle.opacity = 1

    // Build injectedContent now that we have resolvedWrapperStyle. Forward the
    // resolved style so custom content renderers receive a usable, concrete
    // background/color set by this wrapper.
    const injectedContent = (innerProps: any) => {
        if (typeof content === 'function') return content({ ...innerProps, wrapperStyle: resolvedWrapperStyle })
        if (React.isValidElement(content)) return React.cloneElement(content, { ...innerProps, wrapperStyle: resolvedWrapperStyle })
        return content
    }

    return <RechartsTooltip key={key} {...rest} defaultIndex={effectiveDefaultIndex} wrapperStyle={resolvedWrapperStyle} content={injectedContent} />
}

// Export a `Tooltip` alias so callers can import `Tooltip` from this module
export const Tooltip = ChartTooltip

export function renderTooltipWithoutRange(props: any) {
    if (props && props.active && props.payload && props.payload.length) return <ChartTooltipContent {...props} />
    return null
}

export function ChartTooltipContent({ active, payload, wrapperStyle }: any) {
    if (!active || !payload || !payload.length) return null
    // Resolve incoming wrapperStyle (if any) and fall back to concrete
    // computed colors so the tooltip background is always a solid color.
    const resolveInline = (val: any) => {
        if (!val || typeof val !== 'string') return val
        const m = val.match(/var\((--[\w-]+)\)/)
        if (!m) return val
        try {
            if (typeof window !== 'undefined' && window.getComputedStyle) {
                const computed = getComputedStyle(document.documentElement).getPropertyValue(m[1])
                return computed ? computed.trim() : val
            }
        } catch (e) {
            return val
        }
        return val
    }

    const toOpaque = (col: any) => {
        if (!col || typeof col !== 'string') return col
        const rgba = col.match(/rgba?\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)(?:,(\s*([\d\.]+)\s*))?\)/i)
        if (rgba) return `rgb(${rgba[1].trim()}, ${rgba[2].trim()}, ${rgba[3].trim()})`
        const hsla = col.match(/hsla?\(([^,]+),([^,]+),([^,\)]+)(?:,([\d\.]+))?\)/i)
        if (hsla) return `hsl(${hsla[1].trim()}, ${hsla[2].trim()}, ${hsla[3].trim()})`
        if (col.trim() === 'transparent') return undefined
        return col
    }

    let bg = (wrapperStyle && (wrapperStyle.background || wrapperStyle.backgroundColor)) || ''
    bg = resolveInline(bg) || bg
    bg = toOpaque(bg) || ''
    try {
        if (!bg && typeof window !== 'undefined' && window.getComputedStyle) {
            const bodyBg = getComputedStyle(document.body).backgroundColor
            bg = bodyBg || bg || 'rgb(255,255,255)'
        }
    } catch (e) {
        if (!bg) bg = 'rgb(255,255,255)'
    }

    const style = {
        background: bg || 'rgb(255,255,255)',
        color: (wrapperStyle && wrapperStyle.color) || 'var(--color-foreground)',
        opacity: 1,
        ...(wrapperStyle || {}),
    }

    // Prefer the wrapper's text color for labels so they remain readable
    // against the forced opaque background (e.g. white). The little color
    // square still uses the series color for identification.
    const textColor = style.color || 'var(--color-foreground)'

    return (
        <div className="chart-tooltip-box border p-2 rounded shadow" style={style}>
            {payload.map((item: any, i: number) => {
                // Try to derive a color from the payload (fill/stroke/color) falling back to the primary color
                const color = item.color || item.fill || item.stroke || (item.payload && item.payload.fill) || 'hsl(var(--color-primary))'
                const label = item.name ?? item.dataKey ?? ''
                const value = item.value ?? (item.payload && item.payload[item.dataKey]) ?? ''
                return (
                    <div key={i} className="flex items-center gap-2 py-1">
                        <span style={{ width: 10, height: 10, borderRadius: 6, display: 'inline-block', background: color }} />
                        <div className="text-sm font-medium" style={{ color: textColor }}>{label}</div>
                        <div className="text-xs text-muted-foreground ml-2" style={{ color: textColor }}>{value}</div>
                    </div>
                )
            })}
        </div>
    )
}
