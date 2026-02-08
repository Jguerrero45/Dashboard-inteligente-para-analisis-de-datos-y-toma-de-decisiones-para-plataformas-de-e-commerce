export function getApiBase(): string {
    try {
        const active = localStorage.getItem('ACTIVE_STORE_API')
        console.log('getApiBase:', active)
        if (active) return active.replace(/\/$/, '')
    } catch (e) {
        // ignore
    }
    return '/api'
}

export function setActiveStore(apiUrl: string | null) {
    try {
        if (apiUrl) {
            // Convertir URL completa a path relativo si es localhost
            const url = new URL(apiUrl)
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                const path = url.pathname.replace(/\/$/, '')
                console.log('setActiveStore: setting', path)
                localStorage.setItem('ACTIVE_STORE_API', path)
            } else {
                console.log('setActiveStore: setting full', apiUrl)
                localStorage.setItem('ACTIVE_STORE_API', apiUrl.replace(/\/$/, ''))
            }
        } else {
            console.log('setActiveStore: removing')
            localStorage.removeItem('ACTIVE_STORE_API')
        }
    } catch (e) {
        // ignore
    }
}
