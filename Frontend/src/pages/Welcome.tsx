import React from "react"
import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"

const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm tracking-wide uppercase text-slate-700">
                Dashboard Inteligente
              </span>
              <span className="text-xs text-slate-500">
                Análisis de datos para e-commerce
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-800 bg-white hover:bg-slate-50"
              >
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-400 text-white font-semibold"
              >
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="border-b border-slate-200 bg-linear-to-b from-slate-50 via-white to-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid gap-10 lg:grid-cols-[1.1fr,1fr] items-center">
            {/* Texto */}
            <div className="space-y-6">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-sky-600">
                Gestión gerencial para e-commerce
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Convierte tus datos de ventas
                <span className="block text-sky-600">
                  en decisiones inteligentes.
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-600 max-w-xl">
                Un dashboard diseñado para gerentes: KPIs claros, vistas en VES
                y USD, reportes listos para ejecutar y una interfaz minimalista
                que pone el foco en lo que importa.
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <Link to="/register">
                  <Button className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-6 py-2.5">
                    Comenzar ahora
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-800 bg-white hover:bg-slate-50 px-6 py-2.5"
                  >
                    Ver demo en vivo
                  </Button>
                </Link>
                <p className="text-xs md:text-sm text-slate-500">
                  Sin tarjeta de crédito. Entorno de prueba con datos reales.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 text-xs md:text-sm text-slate-500 pt-4 border-t border-slate-200">
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
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-5 space-y-4">
                {/* Top cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">Ventas totales</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      Bs295,420
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-600">
                      ↑ 18% vs. mes anterior
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">
                      Ticket promedio
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      $2,790
                    </p>
                    <p className="mt-1 text-[11px] text-sky-600">
                      VES y USD en una sola vista (BCV)
                    </p>
                  </div>
                </div>

                {/* Chart mock mejorado */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-800">
                      Ventas mensuales
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Últimos 12 meses
                    </span>
                  </div>

                  {/* SVG mock with ups and downs */}
                  <div className="relative h-32 w-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-800">
                      Categorías con mayor ingreso
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Top 3 · 30 días
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Electrónica</span>
                      <span className="text-slate-500">Bs93,118</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Hogar</span>
                      <span className="text-slate-500">Bs29,262</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Deportes</span>
                      <span className="text-slate-500">Bs26,706</span>
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
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
              Diseñado para decisiones gerenciales.
            </h2>
            <p className="mt-2 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
              Centraliza tus ventas, clientes y productos en una sola vista,
              con indicadores claros y reportes listos para tu siguiente
              reunión.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
              <p className="text-sm font-medium text-slate-900">
                Visión 360° del negocio
              </p>
              <p className="text-sm text-slate-600">
                KPIs críticos en un solo panel: ventas, pedidos, márgenes y
                recurrencia de clientes.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
              <p className="text-sm font-medium text-slate-900">
                Datos listos para IA
              </p>
              <p className="text-sm text-slate-600">
                Información limpia y estructurada, preparada para modelos de
                inteligencia artificial y analítica avanzada.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
              <p className="text-sm font-medium text-slate-900">
                Reportes en segundos
              </p>
              <p className="text-sm text-slate-600">
                Exporta reportes en formatos ejecutivos para compartir con tu
                equipo o aliados estratégicos.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">
              ¿Listo para llevar tu dashboard al siguiente nivel?
            </p>
            <p className="text-sm text-slate-600">
              Explora la demo o crea tu cuenta y empieza a decidir con datos.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard">
              <Button className="bg-sky-500 hover:bg-sky-400 text-white font-semibold">
                Ver demo
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50"
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
