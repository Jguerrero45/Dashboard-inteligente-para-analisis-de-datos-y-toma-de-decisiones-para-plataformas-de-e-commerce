"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, Moon, Sun, DollarSign, User, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrency } from "@/hooks/use-currency"

const navigationItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Módulos", href: "/modulos" },
  { name: "Predicciones", href: "/predicciones" },
  { name: "Ventas", href: "/ventas" },
  { name: "Clientes", href: "/clientes" },
  { name: "Productos", href: "/productos" },
  { name: "Recomendaciones IA", href: "/ia-recomendaciones" },
  { name: "Reportes", href: "/reportes" },
  { name: "Finanzas", href: "/finanzas" },
]

export function DashboardHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { currency, toggleCurrency, exchangeRate } = useCurrency()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "hsl(var(--brand-1))", color: "hsl(var(--brand-1) / 0.98)" }}
          >
            <span className="text-xl font-bold">DI</span>
          </div>
          <span className="hidden font-semibold md:inline-block">Dashboard Inteligente</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCurrency}
            className="hidden sm:flex items-center gap-2 bg-transparent"
          >
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold">{currency === "USD" ? "USD" : "Bs"}</span>
            {/* Show current exchange rate when available */}
            <span className="hidden sm:inline-block text-xs text-muted-foreground ml-2">{exchangeRate ? `1 USD ≈ ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(exchangeRate)} Bs` : '—'}</span>
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:flex relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ background: 'hsl(var(--color-negative))' }} />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Cambiar tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/abstract-geometric-shapes.png" alt="Usuario" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">Admin Dashboard</p>
                  <p className="text-xs leading-none text-muted-foreground">admin@ecommerce.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onSelect={() => { localStorage.removeItem("isAuthenticated"); navigate('/'); }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <LogOut className="mr-2 h-4 w-4" style={{ color: 'hsl(var(--color-negative))' }} />
                  <span style={{ color: 'hsl(var(--color-negative))' }}>Cerrar Sesión</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCurrency}
                  className="flex items-center gap-2 justify-center bg-transparent"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">{currency === "USD" ? "Dólares (USD)" : "Bolívares (Bs)"}</span>
                </Button>
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
