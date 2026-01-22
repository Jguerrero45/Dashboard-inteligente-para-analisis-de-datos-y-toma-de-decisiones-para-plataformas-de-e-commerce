"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function AccountSettings() {
    const { addToast } = useToast()

    const [username, setUsername] = useState("")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [company, setCompany] = useState("")
    const [address, setAddress] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token) return
        fetch('/api/profile/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || 'Error al cargar el perfil')
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
                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || 'No se pudo guardar')
                if (data.avatar_url) setAvatarUrl(data.avatar_url)
                addToast({ title: 'Guardado', description: 'Perfil actualizado correctamente.' })
            })
            .catch((err) => {
                console.error('Profile save error', err)
                addToast({ title: 'Error', description: 'No se pudo guardar el perfil.' })
            })
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setAvatarFile(f)
        const url = URL.createObjectURL(f)
        setAvatarUrl(url)
    }

    const uploadAvatar = () => {
        if (!avatarFile) {
            addToast({ title: 'Sin archivo', description: 'Selecciona una imagen para subir.' })
            return
        }
        const token = localStorage.getItem('access_token')
        if (!token) {
            addToast({ title: 'No autenticado', description: 'Inicia sesión para subir el avatar.' })
            return
        }
        const fd = new FormData()
        fd.append('avatar', avatarFile)
        fetch('/api/profile/avatar/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd,
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || 'No se pudo subir el avatar')
                setAvatarUrl(data.avatar_url || null)
                addToast({ title: 'Avatar actualizado', description: 'La foto de perfil fue cambiada.' })
            })
            .catch((err) => {
                console.error('Avatar upload error', err)
                addToast({ title: 'Error', description: 'No se pudo subir el avatar.' })
            })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cuenta</CardTitle>
                <CardDescription>Información básica de perfil.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 items-start">
                    <div className="space-y-3">
                        <div className="w-40 h-40 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-muted-foreground">Sin foto</span>
                            )}
                        </div>
                        <Input type="file" accept="image/*" onChange={handleAvatarChange} />
                        <Button variant="outline" onClick={uploadAvatar}>Cambiar foto</Button>
                    </div>
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
                            <label className="text-xs">Empresa</label>
                            <Input placeholder="Nombre de la empresa" value={company} onChange={(e) => setCompany(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs">Dirección fiscal</label>
                            <Input placeholder="Calle, Ciudad, País" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                        <div className="md:col-span-2 flex gap-2 justify-end">
                            <Button onClick={handleSave}>Guardar</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
