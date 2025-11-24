import React from "react"
import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"
import { AlertCircle, Zap } from "lucide-react"

const Welcome: React.FC = () => {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero image full width */}
            <div className="w-full">
                <div className="relative w-full h-[420px] md:h-[520px] lg:h-[600px] overflow-hidden">
                    <img src="/welcome-illustration.svg" alt="Ilustración" className="w-full h-full object-cover" />

                    {/* subtle overlay governed by CSS variable --overlay so it adapts to theme */}
                    <div className="absolute inset-0" style={{ background: 'var(--overlay)' }} />

                    {/* Top-right auth buttons */}
                    <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
                        <Link to="/login">
                            <Button variant="outline" size="sm">Iniciar sesión</Button>
                        </Link>
                        <Link to="/register">
                            <Button size="sm">Registrarse</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main content below image */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
                        Impulsa tu e-commerce con insights accionables
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Usa nuestro dashboard inteligente para visualizar métricas, obtener recomendaciones por IA
                        y tomar decisiones basadas en datos. Todo en una sola plataforma pensada para crecer tu
                        negocio.
                    </p>

                    <div className="mt-6 flex gap-3">
                        <Link to="/dashboard">
                            <Button className="shadow-lg">Ver demo</Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="outline">Comenzar gratis</Button>
                        </Link>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-semibold">¿Qué resuelve esta herramienta?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Nuestro dashboard está diseñado para dar visibilidad completa del negocio y
                            transformar datos crudos en decisiones accionables. Evita conjeturas y reacciona
                            antes de que un problema afecte tus ventas o el stock.
                        </p>

                        <div className="mt-6 space-y-4">
                            <div className="p-4 border rounded-lg bg-card/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-md bg-primary/10 text-primary"><AlertCircle className="h-5 w-5" /></div>
                                    <div>
                                        <p className="font-medium">Detecta anomalías</p>
                                        <p className="text-sm text-muted-foreground">Identifica picos y caídas inesperadas en ventas y tráfico.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg bg-card/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-md bg-primary/10 text-primary"><Zap className="h-5 w-5" /></div>
                                    <div>
                                        <p className="font-medium">Recomendaciones accionables</p>
                                        <p className="text-sm text-muted-foreground">Sugerencias de precio, stock y promociones basadas en modelos predictivos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold">Casos de uso y cómo funciona</h3>
                        <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>Optimizar precios automáticamente para mejorar margen sin perder volumen.</li>
                            <li>Predecir roturas de stock y reordenar antes de perder ventas.</li>
                            <li>Identificar los segmentos de clientes con mayor LTV y diseñar campañas específicas.</li>
                            <li>Detectar fraudes o errores en pedidos mediante anomalías en patrones.</li>
                        </ul>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 border rounded-lg bg-card/50">
                                <p className="text-sm font-medium">Integración</p>
                                <p className="text-xs text-muted-foreground mt-1">Conecta con ERP, marketplaces y bases de datos.</p>
                            </div>
                            <div className="p-4 border rounded-lg bg-card/50">
                                <p className="text-sm font-medium">Análisis</p>
                                <p className="text-xs text-muted-foreground mt-1">Normalizamos datos y calculamos métricas clave.</p>
                            </div>
                            <div className="p-4 border rounded-lg bg-card/50">
                                <p className="text-sm font-medium">Recomendaciones</p>
                                <p className="text-xs text-muted-foreground mt-1">Modelos generan acciones: precios, stock y campañas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Welcome
