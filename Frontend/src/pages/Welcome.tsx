import React from "react"
import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top nav */}
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm tracking-wide uppercase text-foreground">
                Dashboard Inteligente
              </span>
              <span className="text-xs text-muted-foreground">
                Análisis de datos para e-commerce
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="outline" size="sm">Iniciar sesión</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Contacto</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="border-b border-border bg-background">
          <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid gap-10 lg:grid-cols-[1.1fr,1fr] items-center">
            {/* Texto */}
            <div className="space-y-6">
              <p className="text-xl font-semibold tracking-[0.2em] uppercase text-sky-600">
                Gestión gerencial para e-commerce
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                Convierte tus datos de ventas
                <span className="block text-sky-600">
                  en decisiones inteligentes.
                </span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                Un dashboard diseñado para gerentes: KPIs claros, vistas en VES
                y USD, reportes listos para ejecutar y una interfaz minimalista
                que pone el foco en lo que importa.
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <Link to="/register">
                  <Button className="px-6 py-2.5">Comenzar ahora</Button>
                </Link>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Sin tarjeta de crédito.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 text-xs md:text-sm text-muted-foreground pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Actualización diaria de métricas clave.
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Compatible con datos en USD y conversión automática a VES. (BCV)
                </div>
              </div>
            </div>

            {/* Preview tipo dashboard */}
            <div className="hidden md:block">
              <div className="rounded-2xl border border-border bg-card shadow-xl p-5 space-y-4 text-card-foreground">
                {/* Top cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3 text-card-foreground">
                    <p className="text-[15px] text-muted-foreground">Ventas totales</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      Bs295,420
                    </p>
                    <p className="mt-1 text-[15px] text-emerald-600">
                      ↑ 18% vs. mes anterior
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-card-foreground">
                    <p className="text-[15px] text-muted-foreground">
                      Ticket promedio
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      $2,790
                    </p>
                    <p className="mt-1 text-[15px] text-sky-600">
                      VES y USD en una sola vista (BCV)
                    </p>
                  </div>
                </div>

                {/* Chart mock mejorado */}
                <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-card-foreground">
                      Ventas anuales
                    </p>
                    <span className="text-[15px] text-muted-foreground">
                      Últimos 5 años
                    </span>
                  </div>

                  {/* SVG mock with ups and downs */}
                  <div className="relative h-32 w-full rounded-lg bg-popover border border-border overflow-hidden">
                    <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* area under the line */}
                      <path d="M0,30 L10,24 L20,28 L30,18 L40,22 L50,14 L60,20 L70,12 L80,16 L90,10 L100,14 L110,8 L120,12 L120,40 L0,40 Z" fill="url(#areaGrad)" />

                      {/* jagged line */}
                      <polyline points="0,30 10,24 20,28 30,18 40,22 50,14 60,20 70,12 80,16 90,10 100,14 110,8 120,12" fill="none" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

                      {/* subtle horizontal grid lines */}
                      <g stroke="#e6eef6" strokeWidth="0.6">
                        <line x1="0" y1="8" x2="120" y2="8" />
                        <line x1="0" y1="16" x2="120" y2="16" />
                        <line x1="0" y1="24" x2="120" y2="24" />
                        <line x1="0" y1="32" x2="120" y2="32" />
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Bottom list */}
                <div className="rounded-xl border border-border bg-card p-3 text-card-foreground">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-card-foreground">
                      Categorías con mayor ingreso
                    </p>
                    <span className="text-[15px] text-muted-foreground">
                      Top 3 · 30 días
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[15px]">
                    <div className="flex justify-between">
                      <span className="text-card-foreground">Electrónica</span>
                      <span className="text-muted-foreground">Bs93,118</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-card-foreground">Hogar</span>
                      <span className="text-muted-foreground">Bs29,262</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-card-foreground">Deportes</span>
                      <span className="text-muted-foreground">Bs26,706</span>
                    </div>
                  </div>
                </div>
              </div>
              *Esto son métricas de ejemplo con datos simulados.
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Diseñado para decisiones gerenciales.
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Centraliza tus ventas, clientes y productos en una sola vista,
              con indicadores claros y reportes listos para tu siguiente
              reunión.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm text-card-foreground">
              <p className="text-sm font-medium text-card-foreground">
                Visión 360° del negocio
              </p>
              <p className="text-sm text-muted-foreground">
                KPIs críticos en un solo panel: ventas, pedidos, márgenes y
                recurrencia de clientes.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm text-card-foreground">
              <p className="text-sm font-medium text-card-foreground">
                Datos listos para IA
              </p>
              <p className="text-sm text-muted-foreground">
                Información limpia y estructurada, preparada para modelos de
                inteligencia artificial y analítica avanzada.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm text-card-foreground">
              <p className="text-sm font-medium text-card-foreground">
                Reportes en segundos
              </p>
              <p className="text-sm text-muted-foreground">
                Exporta reportes en formatos ejecutivos para compartir con tu
                equipo o aliados estratégicos.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">
              ¿Listo para llevar tu dashboard al siguiente nivel?
            </p>
            <p className="text-sm text-muted-foreground">
              Explora la demo o crea tu cuenta y empieza a decidir con datos.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/register">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-background/95"
              >
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Welcome

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Cambiar tema"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}