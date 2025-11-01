export function getOverlayRoot() {
    if (typeof document === "undefined") return null
    let root = document.getElementById("__app_overlays")
    if (!root) {
        root = document.createElement("div")
        root.id = "__app_overlays"
        // Place the overlays container in the document without covering the
        // whole viewport. Keep pointer-events disabled on the container itself
        // so only the overlay children receive events. Using a zero-height
        // absolute container avoids interfering with the page scrollbar while
        // still allowing portal children (fixed/absolute positioned) to render
        // relative to the viewport as needed.
        Object.assign(root.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "0",
            pointerEvents: "none",
            zIndex: String(2147483646),
            // avoid transforms or filters here
            transform: "none",
            // allow touch/wheel events to pass through reliably on mobile/desktop
            touchAction: "auto",
            // ensure overlays don't create their own scrolling context
            overflow: "visible",
        })
        document.body.appendChild(root)
        // Force the page to remain scrollable at all times by injecting a
        // global stylesheet rule that sets overflow:auto !important on
        // html and body. This ensures dropdowns or other UI that try to set
        // inline `overflow: hidden` cannot disable scrolling.
        try {
            let style = document.getElementById('__force_allow_scroll') as HTMLStyleElement | null
            if (!style) {
                style = document.createElement('style')
                style.id = '__force_allow_scroll'
                style.textContent = `\nhtml, body { overflow: auto !important; }\n`
                document.head.appendChild(style)
            } else {
                // ensure it's present in head
                if (!document.head.contains(style)) document.head.appendChild(style)
            }

            const win = window as any

            // Initialize lightweight runtime stats for debugging mutation storms
            try {
                win.__overlayMutationStats = win.__overlayMutationStats || {
                    forceAllowScrollHeadObserver: 0,
                    forceAllowScrollBodyObserver: 0,
                    overlayOverflowObserver: 0,
                    overlayPointerGuard: 0,
                    notes: [],
                    lastUpdated: Date.now(),
                }
            } catch (e) { }

            // Keep our style at the end of <head> so it has highest precedence
            // among styles with equal specificity. Also watch for new style nodes
            // that might attempt to override scrolling and re-append our style.
            if (!win.__forceAllowScrollHeadObserver) {
                const headObserver = new MutationObserver((mutations) => {
                    let moved = false
                    for (const m of mutations) {
                        if (m.type === 'childList' && m.addedNodes.length) {
                            moved = true
                        }
                    }
                    if (moved) {
                        try {
                            // re-append style to ensure it's last
                            const s = document.getElementById('__force_allow_scroll')
                            if (s) document.head.appendChild(s)
                            try { win.__overlayMutationStats.forceAllowScrollHeadObserver++ } catch (e) { }
                            try { win.__overlayMutationStats.lastUpdated = Date.now() } catch (e) { }
                        } catch (e) {
                            // ignore
                        }
                    }
                })
                headObserver.observe(document.head, { childList: true, subtree: false })
                win.__forceAllowScrollHeadObserver = headObserver
            }

            // Also observe inline style changes on html/body and force overflow
            // to 'auto' immediately if it's set to 'hidden' (stronger than
            // previous revert approach).
            if (!win.__forceAllowScrollBodyObserver) {
                const forceOverflow = () => {
                    try {
                        if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = 'auto'
                        if (document.body.style.overflow === 'hidden') document.body.style.overflow = 'auto'
                    } catch (e) { }
                }
                const bodyObs = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.type === 'attributes' && m.attributeName === 'style') {
                            forceOverflow()
                            try { win.__overlayMutationStats.forceAllowScrollBodyObserver++ } catch (e) { }
                            try { win.__overlayMutationStats.lastUpdated = Date.now() } catch (e) { }
                        }
                    }
                })
                bodyObs.observe(document.body, { attributes: true, attributeFilter: ['style'] })
                try {
                    bodyObs.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
                } catch (e) { }
                // run once to normalize state
                forceOverflow()
                win.__forceAllowScrollBodyObserver = bodyObs
            }
        } catch (e) {
            // ignore failures in constrained environments
        }
        // install a lightweight guard: some libraries may toggle
        // `document.body.style.overflow = 'hidden'` for modals/backdrops and
        // accidentally block page scroll for small dropdowns. We observe the
        // body's style attribute and if overflow becomes `hidden` but there is
        // no obvious modal/dialog present, we revert the change so scroll
        // remains available. This is conservative and only kicks in when no
        // `[role="dialog"]` or `[data-modal]` is found.
        try {
            const win = window as any
            if (!win.__overlayOverflowObserver) {
                const obs = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.type === 'attributes' && m.attributeName === 'style') {
                            const nowBody = document.body.style.overflow || getComputedStyle(document.body).overflow
                            const nowHtml = document.documentElement.style.overflow || getComputedStyle(document.documentElement).overflow
                            const hasModal = !!document.querySelector('[role="dialog"], [data-modal]')
                            if (!hasModal) {
                                if (nowBody === 'hidden') {
                                    document.body.style.overflow = ''
                                }
                                if (nowHtml === 'hidden') {
                                    document.documentElement.style.overflow = ''
                                }
                                // debug note: prevented html/body overflow:hidden because no dialog found
                                try { win.__overlayMutationStats.overlayOverflowObserver++ } catch (e) { }
                                try { win.__overlayMutationStats.notes.push({ type: 'overflowRevert', when: Date.now() }) } catch (e) { }
                                try { win.__overlayMutationStats.lastUpdated = Date.now() } catch (e) { }
                            }
                        }
                    }
                })
                obs.observe(document.body, { attributes: true, attributeFilter: ['style'] })
                try {
                    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
                } catch (e) {
                    // some environments may not allow observing documentElement; ignore
                }
                win.__overlayOverflowObserver = obs
            }
        } catch (e) {
            // ignore observer failures
        }
        // Development-time instrumentation: detect which code sets
        // `data-scroll-locked` or `pointer-events: none` so we can trace
        // the origin. This patches DOM mutation APIs once and records
        // a stack trace on the window for easier investigation. Only
        // install in dev-like environments.
        try {
            const win = window as any
            // Guarded runtime check for Vite import.meta.env in a type-safe way
            const meta = (import.meta as any)
            const isDevEnv = typeof import.meta !== 'undefined' && meta && meta.env && (meta.env.MODE === 'development' || meta.env.DEV)
            if (!win.__overlayDebugPatches && isDevEnv) {
                win.__overlayDebugPatches = true
                // patch setAttribute
                const origSetAttr = Element.prototype.setAttribute
                Element.prototype.setAttribute = function (name: string, value: string) {
                    try {
                        if (name === 'data-scroll-locked') {
                            const stack = new Error('data-scroll-locked set').stack
                            // store for retrieval in console
                            try { (window as any).__lastDataScrollLockedStack = stack } catch (e) { }
                            try { win.__overlayMutationStats.notes.push({ type: 'data-scroll-locked', when: Date.now(), el: (this as any).tagName }) } catch (e) { }
                            // also log visibly
                            // eslint-disable-next-line no-console
                            console.warn('[overlay-debug] data-scroll-locked set on', this, 'stack:', stack)
                        }
                    } catch (e) { }
                    return origSetAttr.call(this, name, value)
                }

                // patch CSSStyleDeclaration.setProperty to catch pointer-events changes
                const origSetProp = (CSSStyleDeclaration.prototype as any).setProperty as (prop: string, val: string, priority?: string) => void
                    ; (CSSStyleDeclaration.prototype as any).setProperty = function (prop: string, val: string, priority?: string): void {
                        try {
                            if (prop === 'pointer-events' && String(val) === 'none') {
                                const stack = new Error('pointer-events:none set').stack
                                try { (window as any).__lastPointerEventsNoneStack = stack } catch (e) { }
                                try { win.__overlayMutationStats.notes.push({ type: 'pointer-events-none', when: Date.now(), owner: (this as any).cssText?.slice?.(0, 80) }) } catch (e) { }
                                // eslint-disable-next-line no-console
                                console.warn('[overlay-debug] pointer-events:none set via setProperty on', this, 'stack:', stack)
                            }
                        } catch (e) { }
                        return origSetProp.call(this, prop, val, priority)
                    }
            }
        } catch (e) {
            // ignore errors in environments where import.meta doesn't exist
        }
        // Observe body attributes (including dataset) and inline style for
        // pointer-events toggles that some libraries use to temporarily
        // capture input. If `data-scroll-locked` or `pointer-events: none`
        // is applied but there is no visible modal/dialog, revert it so
        // dropdowns can't accidentally disable page interaction/scroll.
        try {
            const win = window as any
            if (!win.__overlayPointerGuard) {
                const guard = new MutationObserver((mutations) => {
                    const hasModal = !!document.querySelector('[role="dialog"], [data-modal]')
                    for (const _m of mutations) {
                        try {
                            // If some script adds a data attribute like
                            // `data-scroll-locked` to the body, remove it when
                            // there's no modal present.
                            if (!hasModal) {
                                if (document.body.hasAttribute('data-scroll-locked')) {
                                    try { document.body.removeAttribute('data-scroll-locked') } catch (e) { }
                                }
                                // If pointer-events is set to none on body/html,
                                // restore it so the scrollbar and page remain interactive.
                                if (document.body.style.pointerEvents === 'none') {
                                    try { document.body.style.pointerEvents = '' } catch (e) { }
                                }
                                if (document.documentElement.style.pointerEvents === 'none') {
                                    try { document.documentElement.style.pointerEvents = '' } catch (e) { }
                                }
                            }
                        } catch (e) { /* ignore per-change failures */ }
                    }
                })
                guard.observe(document.body, { attributes: true, attributeFilter: ['style'] })
                try { guard.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] as any }) } catch (e) { /* some browsers don't allow non-standard filters; fallback below */ }
                // Additionally observe attribute changes generically as a fallback
                guard.observe(document.body, { attributes: true })
                win.__overlayPointerGuard = guard
            }
        } catch (e) {
            // ignore
        }
    }
    return root
}
