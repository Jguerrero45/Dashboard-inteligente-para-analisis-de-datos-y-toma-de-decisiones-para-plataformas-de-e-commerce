import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Link, useNavigate } from "react-router-dom"

const Login: React.FC = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const [remember, setRemember] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!email || !password) {
            setError("Por favor completa todos los campos.")
            return
        }
        // Llamada al endpoint de token JWT del backend
        fetch('/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) {
                    const msg = data.detail || 'Credenciales inválidas.'
                    setError(msg)
                    return
                }
                // Guardar tokens y marcar autenticado
                localStorage.setItem('access_token', data.access)
                if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
                localStorage.setItem('isAuthenticated', 'true')
                navigate('/dashboard')
            })
            .catch((err) => {
                console.error('Login error', err)
                setError('Error de conexión con el servidor.')
            })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Inicia sesión</CardTitle>
                    <CardDescription>Accede a tu cuenta para ver el panel y recomendaciones.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm block mb-1">Correo electrónico</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                            />
                        </div>
                        <div>
                            <label className="text-sm block mb-1">Contraseña</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-3">
                                <Input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                                <span className="text-sm text-muted-foreground">Recordarme</span>
                            </label>
                            <Link to="/forgot" className="ml-auto text-sm text-muted-foreground underline">¿Olvidaste la contraseña?</Link>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="flex items-center justify-between">
                            <Button type="submit">Entrar</Button>
                            <Link to="/register" className="text-sm text-muted-foreground underline">
                                ¿No tienes cuenta?
                            </Link>
                        </div>
                    </form>
                    <div className="mt-4">
                        <Button type="button" onClick={() => { window.location.href = 'http://localhost:8000/admin' }} className="w-full">
                            Ingresar como administrador
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default Login
