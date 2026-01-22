"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { setActiveStore } from "@/lib/activeStore"

export default function StoreSettings() {
    const { addToast } = useToast()
    const [stores, setStores] = useState<any[]>([])
    const [name, setName] = useState('')
    const [apiUrl, setApiUrl] = useState('')
    const [loading, setLoading] = useState(false)

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const fetchStores = async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch('/api/stores/', { headers: { 'Authorization': `Bearer ${token}` } })
            if (!res.ok) throw new Error('No se pudo listar tiendas')
            const data = await res.json()
            setStores(data || [])
        } catch (e) {
            console.error(e)
            addToast({ title: 'Error', description: 'No se pudieron cargar las tiendas.' })
        } finally { setLoading(false) }
    }

    useEffect(() => { fetchStores() }, [])

    const handleCreate = async () => {
        if (!token) return addToast({ title: 'No autenticado', description: 'Inicia sesión.' })
        try {
            const payload = { name, api_url: apiUrl }
            const res = await fetch('/api/stores/', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error('Error creating')
            const created = await res.json()
            setName(''); setApiUrl('')
            await fetchStores()
            // seleccionar automáticamente la tienda creada
            setActive(created)
            addToast({ title: 'Creado', description: 'Tienda creada y seleccionada.' })
        } catch (e) {
            console.error(e)
            addToast({ title: 'Error', description: 'No se pudo crear la tienda.' })
        }
    }

    const handleDelete = async (id: number) => {
        if (!token) return
        try {
            const res = await fetch(`/api/stores/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
            if (!res.ok) throw new Error('delete failed')
            await fetchStores()
            addToast({ title: 'Eliminado', description: 'Tienda eliminada.' })
        } catch (e) {
            console.error(e)
            addToast({ title: 'Error', description: 'No se pudo eliminar la tienda.' })
        }
    }

    const setActive = async (store: any | null) => {
        if (!token) return
        try {
            const payload: any = {}
            payload.selected_store = store ? store.id : null
            const res = await fetch('/api/profile/', {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error('No se pudo seleccionar')
            setActiveStore(store ? store.api_url : null)
            addToast({ title: 'Tienda activa', description: store ? `${store.name} seleccionada` : 'Se quitó la tienda activa' })
        } catch (e) {
            console.error(e)
            addToast({ title: 'Error', description: 'No se pudo cambiar la tienda activa.' })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tienda</CardTitle>
                <CardDescription>Administra las tiendas externas y selecciona la tienda activa.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs">Nombre</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Tienda 1" />
                        <label className="text-xs mt-2">API URL</label>
                        <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://tienda.example.com/api" />
                        <div className="flex justify-end gap-2 mt-2">
                            <Button onClick={handleCreate}>Agregar</Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold">Tiendas</h4>
                        {loading ? <div>cargando...</div> : (
                            <div className="space-y-2">
                                {stores.length === 0 && <div className="text-sm text-muted-foreground">No hay tiendas</div>}
                                {stores.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                                        <div>
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-xs text-muted-foreground">{s.api_url}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setActive(s)}>Seleccionar</Button>
                                            <Button variant="destructive" onClick={() => handleDelete(s.id)}>Eliminar</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4">
                            <Button variant="secondary" onClick={() => setActive(null)}>Quitar tienda activa</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
