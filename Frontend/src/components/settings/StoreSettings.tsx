"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { refreshAccessToken } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { setActiveStore } from "@/lib/activeStore"

export default function StoreSettings() {
    const { addToast } = useToast()
    const [authError, setAuthError] = useState<string | null>(null)
    const [stores, setStores] = useState<any[]>([])
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
    const [name, setName] = useState('')
    const [apiUrl, setApiUrl] = useState('')
    const [loading, setLoading] = useState(false)

    const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)

    const fetchProfile = async () => {
        const token = getToken()
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch('/api/profile/', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
            if (!res.ok) {
                if (res.status === 401) {
                    const refreshed = await refreshAccessToken()
                    if (refreshed) {
                        const newToken = localStorage.getItem('access_token')
                        const r2 = await fetch('/api/profile/', { headers: { 'Authorization': `Bearer ${newToken}` }, cache: 'no-store' })
                        if (r2.ok) {
                            const data2 = await r2.json().catch(() => null)
                            setStores(Array.isArray(data2?.stores) ? data2.stores : [])
                            setSelectedStoreId(data2?.selected_store ? data2.selected_store.id : null)
                            setAuthError(null)
                            setLoading(false)
                            return
                        }
                    }
                    addToast({ title: 'No autorizado', description: 'no estas autorizado para hacer esto' })
                    setAuthError('no estas autorizado para hacer esto')
                    setLoading(false)
                    return
                }
                throw new Error('No se pudo cargar perfil')
            }
            const data = await res.json()
            setStores(Array.isArray(data.stores) ? data.stores : [])
            setSelectedStoreId(data.selected_store ? data.selected_store.id : null)
        } catch (e) {
            console.error(e)
            addToast({ title: 'Error', description: 'No se pudo cargar perfil.' })
        } finally { setLoading(false) }
    }

    // cargar al montar
    useEffect(() => { fetchProfile() }, [])

    const handleCreate = async () => {
        const token = getToken()
        if (!token) return addToast({ title: 'No autenticado', description: 'Inicia sesión.' })
        setLoading(true)
        // alerta al iniciar creación
        if (typeof window !== 'undefined') alert('Creando tienda...')
        try {
            const payload = { name, api_url: apiUrl }
            console.log('[StoreSettings] creating store', payload, 'token?', !!token)
            const res = await fetch('/api/stores/', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
            })
            let data: any = null
            try { data = await res.json() } catch (e) { data = null }
            console.log('[StoreSettings] create response', res.status, data)
            if (!res.ok) {
                if (res.status === 401) {
                    // intentar refresh y reintentar
                    const refreshed = await refreshAccessToken()
                    if (refreshed) {
                        const newToken = localStorage.getItem('access_token')
                        const r2 = await fetch('/api/stores/', {
                            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` }, body: JSON.stringify(payload), cache: 'no-store'
                        })
                        let d2: any = null
                        try { d2 = await r2.json() } catch (e) { d2 = null }
                        if (r2.ok) {
                            await fetchProfile()
                            setName('')
                            setApiUrl('')
                            addToast({ title: 'Creado', description: 'Tienda creada correctamente.' })
                            setLoading(false)
                            setAuthError(null)
                            return
                        }
                        addToast({ title: 'Error', description: (d2 && (d2.detail || JSON.stringify(d2))) || `Error ${r2.status}` })
                        setLoading(false)
                        return
                    }
                    addToast({ title: 'No autorizado', description: 'no estas autorizado para hacer esto' })
                    setAuthError('no estas autorizado para hacer esto')
                    setLoading(false)
                    return
                }
                addToast({ title: 'Error', description: (data && (data.detail || JSON.stringify(data))) || `Error ${res.status}` })
                setLoading(false)
                return
            }
            setAuthError(null)
            // recargar perfil para obtener lista actualizada y selected_store
            await fetchProfile()
            setName('')
            setApiUrl('')
            addToast({ title: 'Creado', description: 'Tienda creada correctamente.' })
        } catch (e) {
            console.error(e)
            addToast({ title: 'Error', description: 'No se pudo crear la tienda.' })
        } finally { setLoading(false) }
    }

    const handleDelete = async (id: number) => {
        const token = getToken()
        if (!token) return addToast({ title: 'No autenticado', description: 'Inicia sesión.' })
        // confirmar eliminación
        if (typeof window !== 'undefined') {
            const storeToDelete = stores.find(s => s.id === id)
            const nameToDelete = storeToDelete ? storeToDelete.name : id
            if (!confirm(`¿Estás seguro que quieres eliminar la tienda "${nameToDelete}"?`)) {
                return
            }
        }
        try {
            let res = await fetch(`/api/stores/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
            if (!res.ok) {
                if (res.status === 401) {
                    const refreshed = await refreshAccessToken()
                    if (refreshed) {
                        const newToken = localStorage.getItem('access_token')
                        res = await fetch(`/api/stores/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${newToken}` }, cache: 'no-store' })
                    } else {
                        addToast({ title: 'No autorizado', description: 'no estas autorizado para hacer esto' })
                        setAuthError('no estas autorizado para hacer esto')
                        return
                    }
                }
            }
            if (!res.ok) throw new Error('delete failed')
            // si la tienda eliminada estaba seleccionada, limpiar selección
            if (selectedStoreId === id) {
                setSelectedStoreId(null)
                setActiveStore(null)
            }
            await fetchProfile()
            addToast({ title: 'Eliminado', description: 'Tienda eliminada.' })
        } catch (e) {
            console.error(e)
            addToast({ title: 'Error', description: 'No se pudo eliminar la tienda.' })
        }
    }

    const setActive = async (storeId: number | null) => {
        const token = getToken()
        if (!token) return addToast({ title: 'No autenticado', description: 'Inicia sesión.' })
        // alerta al cambiar/quitar tienda activa
        if (typeof window !== 'undefined') alert(storeId ? `Cambiando tienda activa a id ${storeId}...` : 'Quitando tienda activa...')
        try {
            const payload: any = { selected_store: storeId }
            let res = await fetch('/api/profile/', {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload), cache: 'no-store'
            })
            if (!res.ok && res.status === 401) {
                const refreshed = await refreshAccessToken()
                if (refreshed) {
                    const newToken = localStorage.getItem('access_token')
                    res = await fetch('/api/profile/', {
                        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` }, body: JSON.stringify(payload), cache: 'no-store'
                    })
                } else {
                    addToast({ title: 'No autorizado', description: 'no estas autorizado para hacer esto' })
                    setAuthError('no estas autorizado para hacer esto')
                    return
                }
            }
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                addToast({ title: 'Error', description: (data && (data.detail || JSON.stringify(data))) || `Error ${res.status}` })
                return
            }
            setAuthError(null)
            // actualizar store activo localmente
            setSelectedStoreId(storeId)
            const activeStore = stores.find(s => s.id === storeId)
            setActiveStore(activeStore ? activeStore.api_url : null)
            addToast({ title: 'Tienda activa', description: storeId ? `${activeStore?.name} seleccionada` : 'Se quitó la tienda activa' })
            // alerta de confirmación al completar el cambio
            if (typeof window !== 'undefined') {
                if (storeId) {
                    alert(`Tienda activa: ${activeStore?.name} seleccionada`)
                } else {
                    alert('Se quitó la tienda activa')
                }
            }
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
                {authError && (
                    <div className="mb-4 px-4 py-2 rounded bg-red-50 text-destructive">{authError}</div>
                )}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs">Nombre</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Tienda 1" />
                        <label className="text-xs mt-2">API URL</label>
                        <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://tienda.example.com/api" />
                        <div className="flex justify-end gap-2 mt-2">
                            <Button onClick={handleCreate} variant="secondary" disabled={loading}>{loading ? '...' : 'Agregar'}</Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold">Tiendas</h4>
                        {loading ? <div>cargando...</div> : (
                            <div className="space-y-2">
                                {stores.length === 0 && <div className="text-sm text-muted-foreground">No hay tiendas</div>}
                                {stores.map(s => (
                                    <div key={s.id} className={`flex items-center justify-between p-2 border rounded ${selectedStoreId === s.id ? 'bg-muted/50' : ''}`}>
                                        <div>
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-xs text-muted-foreground">{s.api_url}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant={selectedStoreId === s.id ? 'default' : 'outline'} onClick={() => setActive(s.id)}>Seleccionar</Button>
                                            <Button variant="destructive" onClick={() => handleDelete(s.id)}>Eliminar</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
