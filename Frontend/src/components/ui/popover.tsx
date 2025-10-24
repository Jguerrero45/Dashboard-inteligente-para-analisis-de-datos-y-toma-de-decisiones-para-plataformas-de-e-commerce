"use client"

import * as React from "react"

type PopoverContextValue = {
    open: boolean
    setOpen: (v: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

export function Popover({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)

    return <PopoverContext.Provider value={{ open, setOpen }}>{children}</PopoverContext.Provider>
}

export const PopoverTrigger = React.forwardRef<HTMLElement, { children: React.ReactElement; asChild?: boolean }>(
    ({ children, asChild }, ref) => {
        const ctx = React.useContext(PopoverContext)
        if (!ctx) return null

        const { setOpen } = ctx

        const child = React.Children.only(children)

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            setOpen((v) => !v)
        }

        if (asChild) {
            return React.cloneElement(child, {
                ref,
                onClick: (e: any) => {
                    handleClick(e)
                    if (typeof child.props.onClick === "function") child.props.onClick(e)
                },
            })
        }

        return (
            <button ref={ref as any} onClick={handleClick} type="button">
                {children}
            </button>
        )
    },
)

PopoverTrigger.displayName = "PopoverTrigger"

export const PopoverContent = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
    ({ children, className }, ref) => {
        const ctx = React.useContext(PopoverContext)
        if (!ctx) return null
        const { open, setOpen } = ctx

        React.useEffect(() => {
            const onDoc = () => setOpen(false)
            if (open) document.addEventListener("click", onDoc)
            return () => document.removeEventListener("click", onDoc)
        }, [open, setOpen])

        if (!open) return null

        return (
            <div ref={ref} className={className} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        )
    },
)

PopoverContent.displayName = "PopoverContent"

export default Popover
