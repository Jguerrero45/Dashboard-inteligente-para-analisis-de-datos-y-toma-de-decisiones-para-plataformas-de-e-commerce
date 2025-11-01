import { useEffect } from "react"

// Simple stack-based body scroll lock to support nested locks.
// Uses a global counter and stores original overflow value the first time.

declare global {
    interface Window {
        __bodyScrollLockCount?: number
        __bodyScrollLockPrevOverflow?: string
    }
}

export default function useLockBodyScroll(active: boolean) {
    useEffect(() => {
        if (!active) return

        const win = window as any
        win.__bodyScrollLockCount = (win.__bodyScrollLockCount || 0) + 1

        // store previous overflow the first time
        if (win.__bodyScrollLockCount === 1) {
            try {
                win.__bodyScrollLockPrevOverflow = document.body.style.overflow || ""
                document.body.style.overflow = "hidden"
            } catch (e) {
                // ignore
            }
        }

        return () => {
            win.__bodyScrollLockCount = (win.__bodyScrollLockCount || 1) - 1
            if (win.__bodyScrollLockCount <= 0) {
                try {
                    document.body.style.overflow = win.__bodyScrollLockPrevOverflow || ""
                } catch (e) {
                    // ignore
                }
                win.__bodyScrollLockCount = 0
                win.__bodyScrollLockPrevOverflow = undefined
            }
        }
    }, [active])
}
