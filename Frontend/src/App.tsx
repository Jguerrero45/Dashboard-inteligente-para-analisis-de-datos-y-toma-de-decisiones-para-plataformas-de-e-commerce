import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/toaster"
import ExchangeRateProvider from "./components/exchange-rate-provider"
import Dashboard from "./pages/Dashboard"
import Modulos from "./pages/Modulos"
import Productos from "./pages/Productos"
import Ventas from "./pages/Ventas"
import Reportes from "./pages/Reportes"
import Clientes from "./pages/Clientes"
import IaRecomendaciones from "./pages/IaRecomendaciones"
import Perfil from "./pages/Perfil"
import Welcome from "./pages/Welcome"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Costos from "./pages/Costos"

function App() {
  const AuthRedirect: React.FC = () => {
    // Mostrar Welcome si no hay sesión, si hay sesión redirigir a dashboard
    const isAuth = typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true"
    return isAuth ? <Navigate to="/dashboard" replace /> : <Welcome />
  }

  const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const isAuth = typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true"
    return isAuth ? children : <Navigate to="/login" replace />
  }

  return (
    // Usar attribute="class" para que next-themes añada la clase `dark` al <html>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme">
      <ExchangeRateProvider />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/modulos" element={<RequireAuth><Modulos /></RequireAuth>} />
          <Route path="/productos" element={<RequireAuth><Productos /></RequireAuth>} />
          <Route path="/ventas" element={<RequireAuth><Ventas /></RequireAuth>} />
          <Route path="/clientes" element={<RequireAuth><Clientes /></RequireAuth>} />
          <Route path="/costos" element={<RequireAuth><Costos /></RequireAuth>} />
          <Route path="/ia-recomendaciones" element={<RequireAuth><IaRecomendaciones /></RequireAuth>} />
          <Route path="/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />
          <Route path="/reportes" element={<RequireAuth><Reportes /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
