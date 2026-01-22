import { Badge } from "@/components/ui/badge"

type Props = {
    status?: string | null
}

export function StatusBadge({ status }: Props) {
    const s = (status || "").toString().toLowerCase()

    // Map known statuses to color classes using CSS variables already present
    // in the project. Uses arbitrary value syntax so tailwind outputs the styles.
    const mapping: Record<string, string> = {
        // ventas
        completada: "bg-[hsl(var(--color-positive))] text-white border-transparent",
        pendiente: "bg-[hsl(var(--brand-4))] text-white border-transparent",
        cancelada: "bg-[hsl(var(--color-destructive))] text-white border-transparent",
        // clientes
        activo: "bg-[hsl(var(--color-positive))] text-white border-transparent",
        inactivo: "bg-[hsl(var(--color-destructive))] text-white border-transparent",
        // productos
        "bajo-stock": "bg-[hsl(var(--brand-4))] text-white border-transparent",
        agotado: "bg-[hsl(var(--color-destructive))] text-white border-transparent",
        // optional 4th state example
        reservado: "bg-[hsl(var(--brand-5))] text-white border-transparent",
    }

    const className = mapping[s] ?? "bg-[hsl(var(--color-muted))] text-foreground border-transparent"

    // Human-friendly label
    const label = s ? (s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')) : '—'

    return <Badge className={className}>{label}</Badge>
}

export default StatusBadge
