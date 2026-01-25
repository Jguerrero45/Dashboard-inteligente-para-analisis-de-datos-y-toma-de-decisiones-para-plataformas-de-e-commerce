import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Link, useNavigate } from "react-router-dom"

const TermsModal: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
    if (!show) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Términos y condiciones"
            style={{ backgroundColor: "var(--overlay)" }}
        >
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl border dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 p-6 border-b bg-slate-900">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Términos y Condiciones de Uso</h2>
                        <p className="text-sm text-white mt-1">Última actualización: 14 de enero de 2026</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Cerrar"
                        className="text-sm text-white hover:text-gray-300"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-112px)] space-y-4 text-base leading-7 text-white bg-slate-900">
                    <p>
                        <strong>1. Objeto del servicio.</strong> Esta plataforma académica permite registrar ventas, clientes,
                        inventario y métricas de negocio con fines educativos y de investigación. No está destinada a operaciones
                        comerciales reales sin supervisión.
                    </p>
                    <p>
                        <strong>2. Alcance y disponibilidad.</strong> El acceso puede verse interrumpido por mantenimiento,
                        actualizaciones o limitaciones técnicas. No se garantiza disponibilidad continua ni ausencia de errores.
                    </p>
                    <p>
                        <strong>3. Registro y veracidad de la información.</strong> El usuario declara que los datos suministrados
                        son exactos. El uso de datos falsos puede implicar suspensión.
                    </p>
                    <p>
                        <strong>4. Uso aceptable.</strong> Se prohíbe cargar contenido ilícito, difamatorio, discriminatorio o que
                        infrinja derechos de terceros.
                    </p>
                    <p>
                        <strong>5. Datos personales y privacidad.</strong> La información se procesa para fines académicos y no se
                        compartirá con terceros ajenos al curso salvo obligación legal.
                    </p>
                    <p>
                        <strong>6. Seguridad y contraseñas.</strong> El usuario es responsable de sus credenciales. Las contraseñas
                        deben tener mínimo 8 caracteres.
                    </p>
                    <p>
                        <strong>7. Propiedad intelectual.</strong> El software y materiales son propiedad de sus autores y se
                        otorgan para uso académico.
                    </p>
                    <p>
                        <strong>8. Datos de prueba.</strong> Use datos ficticios o anonimice información sensible.
                    </p>
                    <p>
                        <strong>9. Limitación de responsabilidad.</strong> El sistema se ofrece "tal cual"; los desarrolladores no
                        serán responsables por daños indirectos.
                    </p>
                    <p>
                        <strong>10. Aceptación.</strong> Al crear la cuenta y marcar la casilla, el usuario acepta estos términos.
                    </p>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t bg-white dark:bg-slate-900">
                    <Button type="button" variant="secondary" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                        Cerrar
                    </Button>
                    <Button type="button" onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                        He leído y acepto
                    </Button>
                </div>
            </div>
        </div>
    )
}

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
    const [showTerms, setShowTerms] = useState(false)
    const navigate = useNavigate()

    const validatePassword = (p: string) => p.length >= 8

    const handleSubmit = async (e: React.FormEvent) => {
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

        const payload = { username: email, email, password, password2: confirm }

        try {
            const res = await fetch("/api/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) {
                const firstError = data?.email || data?.password || data?.username || data || "Error en el registro."
                setError(Array.isArray(firstError) ? firstError.join(" ") : String(firstError))
                return
            }

            navigate("/login")
        } catch (err) {
            console.error("Register error", err)
            setError("Error de conexión con el servidor.")
        }
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
                                <label className="text-sm block mb-1">Teléfono (opcional)</label>
                                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+58 400 000 0000" />
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

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <label className="inline-flex items-center gap-2">
                                <Input type="checkbox" className="h-4 w-4" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                                <span>He leído y acepto</span>
                            </label>
                            <button type="button" className="underline text-primary" onClick={() => setShowTerms(true)}>
                                términos y condiciones
                            </button>
                        </div>

                        <TermsModal show={showTerms} onClose={() => setShowTerms(false)} />

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <div className="flex items-center justify-between">
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">Crear cuenta</Button>
                            <Link to="/login" className="text-sm text-muted-foreground underline">
                                ¿Ya tienes cuenta?
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default Register
