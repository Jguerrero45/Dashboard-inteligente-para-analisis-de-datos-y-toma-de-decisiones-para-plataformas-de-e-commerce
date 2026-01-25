export async function refreshAccessToken(): Promise<boolean> {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
    if (!refresh) return false
    try {
        const res = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        })
        if (!res.ok) return false
        const data = await res.json()
        if (data && data.access) {
            localStorage.setItem('access_token', data.access)
            return true
        }
        return false
    } catch (e) {
        console.error('refreshAccessToken error', e)
        return false
    }
}
