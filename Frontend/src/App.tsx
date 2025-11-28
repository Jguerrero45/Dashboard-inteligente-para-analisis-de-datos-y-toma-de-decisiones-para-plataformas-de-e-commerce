import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/toaster"
import ExchangeRateProvider from "./components/exchange-rate-provider"
import Dashboard from "./pages/Dashboard"
import Modulos from "./pages/Modulos"
import Predicciones from "./pages/Predicciones"
import Productos from "./pages/Productos"
import Ventas from "./pages/Ventas"
import Reportes from "./pages/Reportes"
import Clientes from "./pages/Clientes"
import IaRecomendaciones from "./pages/IaRecomendaciones"
import Perfil from "./pages/Perfil"
import Welcome from "./pages/Welcome"
import Login from "./pages/Login"
import Register from "./pages/Register"

function App() {
  const AuthRedirect: React.FC = () => {
    // Mostrar Welcome si no hay sesión, si hay sesión redirigir a dashboard
    const isAuth = typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true"
    return isAuth ? <Navigate to="/dashboard" replace /> : <Welcome />
  }

  return (
    // Usar attribute="class" para que next-themes añada la clase `dark` al <html>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme">
      <ExchangeRateProvider />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/modulos" element={<Modulos />} />
          <Route path="/predicciones" element={<Predicciones />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/ia-recomendaciones" element={<IaRecomendaciones />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
