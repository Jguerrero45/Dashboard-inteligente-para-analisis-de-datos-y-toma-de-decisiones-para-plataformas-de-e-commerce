export const FONT_SIZE_MAP: Record<string, number> = { sm: 14, md: 16, lg: 18 }

export function applyRootFontSize(size: string) {
    const px = FONT_SIZE_MAP[size] ?? 16
    if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--root-font-size", `${px}px`)
        document.documentElement.style.fontSize = `${px}px`
    }
}
