"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { refreshAccessToken } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function AccountSettings() {
    const { addToast } = useToast()
    const [authError, setAuthError] = useState<string | null>(null)

    const [username, setUsername] = useState("")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [company, setCompany] = useState("")
    const [address, setAddress] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token) return
        fetch('/api/profile/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(async (res) => {
                let data: any = null
                try { data = await res.json() } catch (e) { data = null }
                if (!res.ok) {
                    console.error('Profile load failed', res.status, data)
                    if (res.status === 401) {
                        // intentar refresh token una vez
                        const refreshed = await refreshAccessToken()
                        if (refreshed) {
                            const newToken = localStorage.getItem('access_token')
                            const r2 = await fetch('/api/profile/', { headers: { 'Authorization': `Bearer ${newToken}` } })
                            const d2 = await r2.json().catch(() => null)
                            if (r2.ok) {
                                setUsername(d2.username || '')
                                const full = [d2.first_name || '', d2.last_name || ''].filter(Boolean).join(' ').trim()
                                setFullName(full)
                                setEmail(d2.email || '')
                                setPhone(d2.phone || '')
                                setCompany(d2.company || '')
                                setAddress(d2.address || '')
                                setAvatarUrl(d2.avatar_url || null)
                                setAuthError(null)
                                return
                            }
                        }
                        addToast({ title: 'No autorizado', description: 'no estas autorizado para hacer esto' })
                        setAuthError('no estas autorizado para hacer esto')
                        return
                    }
                    throw new Error((data && (data.detail || JSON.stringify(data))) || `Error ${res.status}`)
                }
                setUsername(data.username || '')
                const full = [data.first_name || '', data.last_name || ''].filter(Boolean).join(' ').trim()
                setFullName(full)
                setEmail(data.email || '')
                setPhone(data.phone || '')
                setCompany(data.company || '')
                setAddress(data.address || '')
                setAvatarUrl(data.avatar_url || null)
            })
            .catch((err) => {
                console.error('Profile load error', err)
            })
    }, [])

    const handleSave = () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            addToast({ title: 'No autenticado', description: 'Inicia sesión para guardar cambios.' })
            return
        }
        const [firstName, ...rest] = fullName.trim().split(' ')
        const lastName = rest.join(' ')
        const payload = {
            first_name: firstName || '',
            last_name: lastName || '',
            email,
            phone,
            company,
            address,
        }
        fetch('/api/profile/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                let data: any = null
                try { data = await res.json() } catch (e) { data = null }
                if (!res.ok) {
                    console.error('Profile save failed', res.status, data)
                    if (res.status === 401) {
                        addToast({ title: 'No autorizado', description: 'no estas autorizado para hacer esto' })
                        setAuthError('no estas autorizado para hacer esto')
                        alert('No autorizado para guardar cambios.')
                        return
                    }
                    const err = (data && (data.detail || JSON.stringify(data))) || `Error ${res.status}`
                    addToast({ title: 'Error', description: err })
                    alert(String(err))
                    return
                }
                setAuthError(null)
                if (data.avatar_url) setAvatarUrl(data.avatar_url)
                addToast({ title: 'Guardado', description: 'Perfil actualizado correctamente.' })
                alert('Perfil actualizado correctamente.')
            })
            .catch((err) => {
                console.error('Profile save error', err)
                addToast({ title: 'Error', description: 'No se pudo guardar el perfil.' })
                alert('No se pudo guardar el perfil.')
            })
    }

    // La opción de subir avatar fue removida por problemas de integración con el backend.

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cuenta</CardTitle>
                <CardDescription>Información básica de perfil.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs">Nombre completo</label>
                            <Input placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs">Nombre de usuario</label>
                            <Input placeholder="usuario" value={username} onChange={(e) => setUsername(e.target.value)} disabled />
                        </div>
                        <div>
                            <label className="text-xs">Email</label>
                            <Input placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs">Teléfono</label>
                            <Input placeholder="+58 412 0000000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs">Dirección fiscal</label>
                            <Input placeholder="Calle, Ciudad, País" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                        <div className="md:col-span-2 flex gap-2 justify-end">
                            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">Guardar</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
