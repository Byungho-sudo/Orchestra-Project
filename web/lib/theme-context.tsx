"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { ThemeConfig } from "@/lib/theme"

const ThemeContext = createContext<Required<ThemeConfig> | null>(null)

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Required<ThemeConfig>
  children: ReactNode
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useInitialTheme() {
  return useContext(ThemeContext)
}
