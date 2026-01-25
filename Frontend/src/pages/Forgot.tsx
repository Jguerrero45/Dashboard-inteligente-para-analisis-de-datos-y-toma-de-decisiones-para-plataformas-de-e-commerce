import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Link, useNavigate } from "react-router-dom"

export default function Forgot() {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Recuperación de contraseña</CardTitle>
                    <CardDescription>Solicita asistencia para restablecer tu contraseña</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Si olvidaste tu contraseña, por favor comunícate con tus superiores — ellos son los autorizados para
                        gestionar cambios de contraseña en este sistema.
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate(-1)} variant="outline">Volver</Button>
                        <Link to="/login"><Button variant="secondary">Ir a Iniciar sesión</Button></Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
