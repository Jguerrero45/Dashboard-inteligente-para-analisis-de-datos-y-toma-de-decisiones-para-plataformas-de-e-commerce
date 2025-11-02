import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/toaster"
import Dashboard from "./pages/Dashboard"
import Modulos from "./pages/Modulos"
import Predicciones from "./pages/Predicciones"
import Productos from "./pages/Productos"
import Ventas from "./pages/Ventas"
import Reportes from "./pages/Reportes"
import Clientes from "./pages/Clientes"
import IaRecomendaciones from "./pages/IaRecomendaciones"
import Finanzas from "./pages/Finanzas"
import Perfil from "./pages/Perfil"

function App() {
  return (
    // Usar attribute="class" para que next-themes añada la clase `dark` al <html>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/modulos" element={<Modulos />} />
          <Route path="/predicciones" element={<Predicciones />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/ia-recomendaciones" element={<IaRecomendaciones />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/finanzas" element={<Finanzas />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
