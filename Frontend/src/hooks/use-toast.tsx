import { useCallback, useState } from "react"

type ToastItem = {
    id: string
    title?: string
    description?: string
    action?: any
    [key: string]: any
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
        const id = Math.random().toString(36).slice(2, 9)
        setToasts((s) => [...s, { id, ...toast }])
        return id
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((s) => s.filter((t) => t.id !== id))
    }, [])

    return { toasts, addToast, removeToast }
}

export default useToast
