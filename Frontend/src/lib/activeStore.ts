export function getApiBase(): string {
    try {
        const active = localStorage.getItem('ACTIVE_STORE_API')
        if (active) return active.replace(/\/$/, '')
    } catch (e) {
        // ignore
    }
    return (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000/api'
}

export function setActiveStore(apiUrl: string | null) {
    try {
        if (apiUrl) localStorage.setItem('ACTIVE_STORE_API', apiUrl.replace(/\/$/, ''))
        else localStorage.removeItem('ACTIVE_STORE_API')
    } catch (e) {
        // ignore
    }
}
