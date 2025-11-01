"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force default to light and disable following system preference by default
  // so the app uses light mode unless the user toggles it. Props passed from
  // the caller (e.g. App.tsx) can override these defaults.
  const providerProps: ThemeProviderProps = {
    enableSystem: false,
    defaultTheme: "light",
    attribute: "class",
    ...props,
  }

  return <NextThemesProvider {...providerProps}>{children}</NextThemesProvider>
}
