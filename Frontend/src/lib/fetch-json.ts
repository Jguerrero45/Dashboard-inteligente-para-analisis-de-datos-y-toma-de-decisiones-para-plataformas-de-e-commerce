export async function fetchJson<T>(url: string, init?: RequestInit, fallback?: T): Promise<T> {
    const res = await fetch(url, init)
    const text = await res.text().catch(() => "")

    if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`)
    }

    if (!text) {
        return fallback as T
    }

    try {
        return JSON.parse(text) as T
    } catch (err) {
        if (fallback !== undefined) return fallback
        throw err
    }
}
