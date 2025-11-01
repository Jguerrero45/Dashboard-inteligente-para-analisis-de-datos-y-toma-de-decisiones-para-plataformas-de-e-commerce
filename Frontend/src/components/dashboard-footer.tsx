import { Link } from "react-router-dom"
import { Github, Linkedin, Mail } from "lucide-react"

export function DashboardFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Acerca del Proyecto</h3>
            <p className="text-sm text-muted-foreground text-pretty">
              Dashboard inteligente para análisis de datos y toma de decisiones en plataformas de e-commerce.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/analisis" className="text-muted-foreground hover:text-foreground transition-colors">
                  Análisis de Datos
                </Link>
              </li>
              <li>
                <Link to="/ventas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Gestión de Ventas
                </Link>
              </li>
              <li>
                <Link to="/reportes" className="text-muted-foreground hover:text-foreground transition-colors">
                  Reportes
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/documentacion" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentación
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link to="/soporte" className="text-muted-foreground hover:text-foreground transition-colors">
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contacto</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-90 transition-opacity"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" style={{ color: 'hsl(var(--brand-3))' }} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-90 transition-opacity"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" style={{ color: 'hsl(var(--brand-5))' }} />
              </a>
              <a
                href="mailto:contacto@dashboard.com"
                className="hover:opacity-90 transition-opacity"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" style={{ color: 'hsl(var(--brand-6))' }} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Universidad José Antonio Páez. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground">Desarrollado por Angel De Crescenzo y José Guerrero</p>
        </div>
      </div>
    </footer>
  )
}
