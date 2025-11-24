import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { Github, Mail } from "lucide-react"

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
        // Simulación de autenticación. Aquí conectarías con la API.
        // Asumimos login exitoso para demo.
        localStorage.setItem("isAuthenticated", "true")
        navigate("/dashboard")
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

                        <div className="mt-3 border-t pt-3">
                            <p className="text-sm text-muted-foreground mb-2">O inicia sesión con</p>
                            <div className="flex gap-3">
                                <Button variant="outline" asChild>
                                    <a className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</a>
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">Demo local: no se envían credenciales.</p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default Login
