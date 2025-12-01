import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Link, useNavigate } from "react-router-dom"

const Register: React.FC = () => {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [company, setCompany] = useState("")
    const [role, setRole] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const validatePassword = (p: string) => p.length >= 8

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!firstName || !lastName || !email || !password || !confirm) {
            setError("Por favor completa todos los campos obligatorios.")
            return
        }

        if (!validatePassword(password)) {
            setError("La contraseña debe tener al menos 8 caracteres.")
            return
        }

        if (password !== confirm) {
            setError("Las contraseñas no coinciden.")
            return
        }

        if (!acceptTerms) {
            setError("Debes aceptar los términos y condiciones.")
            return
        }

        // Llamada al endpoint de registro en el backend
        const payload = {
            username: email,
            email,
            password,
            password2: confirm,
        }

        fetch('/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) {
                    // manejar errores devueltos por DRF
                    const firstError = data?.email || data?.password || data?.username || data || 'Error en el registro.'
                    setError(Array.isArray(firstError) ? firstError.join(' ') : String(firstError))
                    return
                }
                // Registro exitoso: opcionalmente iniciar sesión automáticamente solicitando token
                // Aquí iremos a login (o podríamos solicitar token directamente)
                navigate('/login')
            })
            .catch((err) => {
                console.error('Register error', err)
                setError('Error de conexión con el servidor.')
            })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Crear cuenta</CardTitle>
                    <CardDescription>Regístrate para comenzar a usar el dashboard inteligente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm block mb-1">Nombre</label>
                                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" />
                            </div>
                            <div>
                                <label className="text-sm block mb-1">Apellido</label>
                                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pérez" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm block mb-1">Empresa (opcional)</label>
                                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Mi tienda S.A." />
                            </div>
                            <div>
                                <label className="text-sm block mb-1">Rol</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full rounded-md px-3 py-2 text-sm"
                                    style={{
                                        backgroundColor: 'hsl(var(--color-popover))',
                                        color: 'hsl(var(--color-popover-foreground))',
                                        borderColor: 'hsl(var(--color-border))',
                                    }}
                                >
                                    <option value="">Selecciona un rol</option>
                                    <option value="owner">Propietario</option>
                                    <option value="manager">Manager</option>
                                    <option value="analyst">Analista</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm block mb-1">Teléfono (opcional)</label>
                                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 000 0000" />
                            </div>
                            <div>
                                <label className="text-sm block mb-1">Correo electrónico</label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm block mb-1">Contraseña</label>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
                                <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres.</p>
                            </div>
                            <div>
                                <label className="text-sm block mb-1">Confirmar contraseña</label>
                                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="********" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-3">
                                <Input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                                <span className="text-sm text-muted-foreground">Acepto los términos y condiciones</span>
                            </label>
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <div className="flex items-center justify-between">
                            <Button type="submit">Crear cuenta</Button>
                            <Link to="/login" className="text-sm text-muted-foreground underline">
                                ¿Ya tienes cuenta?
                            </Link>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">Demo local: no se crean usuarios reales.</p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default Register
