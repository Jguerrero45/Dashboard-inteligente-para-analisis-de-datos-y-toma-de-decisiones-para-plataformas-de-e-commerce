import React from "react"

type Props = { children: React.ReactNode }

export default class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: any }> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: any, info: any) {
        // Log to console for developer debugging
        // In the future, send to error reporting service
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 rounded border bg-destructive/5">
                    <h3 className="text-sm font-semibold text-destructive">Error al mostrar recomendaciones</h3>
                    <p className="text-sm text-muted-foreground">Hubo un problema al renderizar las recomendaciones IA. Revisa la consola para más detalles.</p>
                </div>
            )
        }
        return this.props.children as any
    }
}
