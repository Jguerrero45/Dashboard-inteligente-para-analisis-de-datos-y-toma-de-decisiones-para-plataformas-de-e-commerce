"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { getOverlayRoot } from "@/lib/overlay"

type PopoverContextValue = {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    // use MutableRefObject so `.current` can be assigned to from consumers
    triggerRef: React.MutableRefObject<HTMLElement | null>
    // whether to render the content into the overlay root via portal
    usePortal: boolean
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

import useLockBodyScroll from "@/hooks/use-lock-body-scroll"

export function Popover({ children, usePortal = true, lockScroll = false }: { children: React.ReactNode; usePortal?: boolean; lockScroll?: boolean }) {
    const [open, setOpen] = React.useState(false)
    const triggerRef = React.useRef<HTMLElement | null>(null)

    // Optionally lock body scroll when popover is open
    useLockBodyScroll(open && lockScroll)

    return (
        <PopoverContext.Provider value={{ open, setOpen, triggerRef, usePortal }}>{children}</PopoverContext.Provider>
    )
}

export const PopoverTrigger = React.forwardRef<HTMLElement, { children: React.ReactElement; asChild?: boolean }>(
    ({ children, asChild }, ref) => {
        const ctx = React.useContext(PopoverContext)
        if (!ctx) return null

        const { setOpen, triggerRef } = ctx

        const child = React.Children.only(children) as React.ReactElement

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            setOpen((v) => !v)
        }

        const setRefs = (node: HTMLElement | null) => {
            triggerRef.current = node
            if (!ref) return
            if (typeof ref === "function") ref(node)
            else (ref as any).current = node
        }

        if (asChild) {
            return React.cloneElement(child, {
                ref: setRefs,
                onClick: (e: any) => {
                    handleClick(e)
                    if (typeof child.props.onClick === "function") child.props.onClick(e)
                },
            })
        }

        return (
            <button ref={(node) => setRefs(node as any)} onClick={handleClick} type="button" className="inline-flex items-center justify-center text-slate-800 dark:text-white hover:bg-muted rounded-md">
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
        const { open, setOpen, triggerRef } = ctx

        const elRef = React.useRef<HTMLDivElement | null>(null)

        React.useEffect(() => {
            const onKey = (e: KeyboardEvent) => {
                if (e.key === "Escape") setOpen(false)
            }
            if (open) document.addEventListener("keydown", onKey)
            return () => document.removeEventListener("keydown", onKey)
        }, [open, setOpen])

        React.useEffect(() => {
            const onDoc = (e: MouseEvent) => {
                const el = elRef.current
                if (!el) return
                if (e.target instanceof Node && el.contains(e.target as Node)) return
                setOpen(false)
            }

            if (open) document.addEventListener("click", onDoc)
            return () => document.removeEventListener("click", onDoc)
        }, [open, setOpen])

        const [stylePos, setStylePos] = React.useState<React.CSSProperties | null>(null)

        React.useLayoutEffect(() => {
            if (!open) return setStylePos(null)
            const anchor = triggerRef.current
            if (!anchor) return

            const computePosition = () => {
                const rect = anchor.getBoundingClientRect()

                // Responsive desired width: adapt on small screens
                let desiredWidth = 320
                const desiredHeight = 360
                const viewportPadding = 16
                if (window.innerWidth - viewportPadding * 2 < desiredWidth) {
                    // use almost full width on small screens
                    desiredWidth = Math.max(200, window.innerWidth - viewportPadding * 2)
                }
                const offset = 8

                const spaceBelow = window.innerHeight - rect.bottom
                const spaceAbove = rect.top

                let top: number
                let left: number

                // Decide vertical direction: open down if there's space in the
                // viewport, else open upwards. We still base the decision on
                // viewport space (rect is viewport-relative), but compute the
                // final coordinates in document space so the popover will scroll
                // with the page (position: absolute).
                if (spaceBelow >= desiredHeight || spaceBelow >= spaceAbove) {
                    top = rect.bottom + offset + window.scrollY
                } else {
                    top = rect.top - desiredHeight - offset + window.scrollY
                }

                // Center horizontally relative to the trigger (safer on small devices)
                left = rect.left + rect.width / 2 - desiredWidth / 2 + window.scrollX

                // Clamp inside viewport horizontally but in document coords
                const minLeft = viewportPadding + window.scrollX
                const maxLeft = Math.max(viewportPadding + window.scrollX, window.scrollX + window.innerWidth - desiredWidth - viewportPadding)
                if (left < minLeft) left = minLeft
                if (left > maxLeft) left = maxLeft

                const minTop = window.scrollY + 8
                const maxTop = Math.max(window.scrollY + 8, window.scrollY + window.innerHeight - 80) // allow some room
                if (top < minTop) top = minTop
                if (top > maxTop) top = maxTop

                setStylePos({ position: "absolute", top, left, zIndex: 9999, width: desiredWidth, maxHeight: desiredHeight, overflowY: "auto" })
            }

            // compute once immediately
            computePosition()

            // Recompute position immediately on open and on window resize only.
            // We intentionally do NOT reposition on scroll so the popover remains
            // visually fixed where it opened (avoids the popover 'following' the
            // field while the user scrolls).
            const onResize = () => {
                computePosition()
            }

            window.addEventListener("resize", onResize)

            return () => {
                window.removeEventListener("resize", onResize)
            }
        }, [open, triggerRef])

        // merge forwarded ref (always run hook to keep hooks order stable)
        React.useEffect(() => {
            if (!ref) return
            if (typeof ref === "function") ref(elRef.current)
            else (ref as any).current = elRef.current
        }, [ref])

        // Close popover when browser history changes (back/forward) to avoid leftover portal covering UI
        React.useEffect(() => {
            const onPop = () => setOpen(false)
            window.addEventListener("popstate", onPop)
            return () => window.removeEventListener("popstate", onPop)
        }, [setOpen])

        if (!open) return null

        // Do not render until we've calculated the position to avoid flashes that can cover the whole page
        if (!stylePos) return null

        const root = getOverlayRoot() || document.body

        const content = (
            <div
                ref={elRef}
                className={`border rounded-md shadow-md p-0 ${className ?? ""}`}
                style={{
                    ...stylePos,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    // use theme tokens defined in CSS. `index.css` defines --color-popover
                    // as an HSL triplet, so we wrap it with `hsl(...)`.
                    background: "hsl(var(--color-popover))",
                    color: "hsl(var(--color-popover-foreground))",
                    // ensure the popover receives pointer events even though the overlay
                    // root uses `pointer-events: none` so it doesn't block the page.
                    pointerEvents: "auto",
                    // ensure full opacity
                    opacity: 1,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ maxHeight: stylePos.maxHeight ?? 360, overflowY: "auto" }}>{children}</div>
            </div>
        )

        // If the consumer opted out of portal rendering, render inline so the
        // popover participates in the document scroll flow (it will move with
        // page content). Otherwise render into the overlay root as a portal.
        if (!ctx.usePortal) return content

        return createPortal(content, root as Element)
    },
)

PopoverContent.displayName = "PopoverContent"

export default Popover
