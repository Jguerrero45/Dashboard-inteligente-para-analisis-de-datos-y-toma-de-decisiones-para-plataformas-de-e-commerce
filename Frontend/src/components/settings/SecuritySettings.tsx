"use client"

import { useState } from "react"
import { refreshAccessToken } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import PasswordInput from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function SecuritySettings() {
    const { addToast } = useToast()
    const [password, setPassword] = useState("")
    const [password2, setPassword2] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    const handleChangePassword = async () => {
        const token = localStorage.getItem('access_token')
        if (!token) return addToast({ title: 'No autenticado', description: 'Inicia sesión.' })
        if (!password || !password2) return addToast({ title: 'Campos requeridos', description: 'Completa ambos campos de contraseña.' })
        setLoading(true)
        try {
            const body: any = { password, password2 }
            if (currentPassword) body.current_password = currentPassword
            console.log('[SecuritySettings] change password payload', { hasToken: !!token, body })
            const res = await fetch('/api/profile/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            })
            let data: any = null
            try { data = await res.json() } catch (e) { data = null }
            console.log('[SecuritySettings] response', res.status, data)
            if (!res.ok) {
                if (res.status === 401) {
                    // intentar refresh
                    const refreshed = await refreshAccessToken()
                    if (refreshed) {
                        const newToken = localStorage.getItem('access_token')
                        const r2 = await fetch('/api/profile/', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` },
                            body: JSON.stringify({ current_password: currentPassword, password, password2 }),
                        })
                        let d2: any = null
                        try { d2 = await r2.json() } catch (e) { d2 = null }
                        if (r2.ok) {
                            setAuthError(null)
                            setPassword('')
                            setPassword2('')
                            setCurrentPassword('')
                            addToast({ title: 'Contraseña actualizada', description: 'Tu contraseña fue cambiada correctamente.' })
                            alert('Contraseña cambiada correctamente.')
                            setLoading(false)
                            return
                        }
                        const msg2 = (d2 && (d2.password || d2.detail)) || `Error ${r2.status}`
                        const errorText = Array.isArray(msg2) ? msg2.join(' ') : String(msg2)
                        addToast({ title: 'Error', description: errorText })
                        alert(errorText)
                        setLoading(false)
                        return
                    }
                    addToast({ title: 'No autorizado', description: 'no estas autorizado para hacer esto' })
                    setAuthError('no estas autorizado para hacer esto')
                    setLoading(false)
                    return
                }
                const msg = (data && (data.password || data.detail)) || `Error ${res.status}`
                const errText = Array.isArray(msg) ? msg.join(' ') : String(msg)
                addToast({ title: 'Error', description: errText })
                alert(errText)
                setLoading(false)
                return
            }
            setAuthError(null)
            setPassword('')
            setPassword2('')
            setCurrentPassword('')
            addToast({ title: 'Contraseña actualizada', description: 'Tu contraseña fue cambiada correctamente.' })
            alert('Contraseña cambiada correctamente.')
        } catch (e) {
            console.error('Change password error', e)
            addToast({ title: 'Error', description: 'No se pudo cambiar la contraseña.' })
            alert('No se pudo cambiar la contraseña.')
        } finally { setLoading(false) }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Cambia tu contraseña y revisa la política de seguridad.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs">Contraseña actual</label>
                            <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Contraseña actual" />
                        </div>
                        <div>
                            <label className="text-xs">Nueva contraseña</label>
                            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" />
                        </div>
                        <div>
                            <label className="text-xs">Confirmar nueva</label>
                            <PasswordInput value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Confirmar" />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium">Política de contraseñas</p>
                        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <li>Longitud mínima: 8 caracteres</li>
                            <li>Debe incluir mayúsculas, minúsculas y números</li>
                            <li>No reutilizar contraseñas anteriores (si aplica)</li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleChangePassword} disabled={loading}>{loading ? 'Enviando...' : 'Actualizar contraseña'}</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
