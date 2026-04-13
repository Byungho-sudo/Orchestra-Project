import type { User } from "@supabase/supabase-js"

export type ThemeFamily = "default" | "terra"
export type ThemeMode = "light" | "dark"
export const THEME_FAMILY_COOKIE = "orchestra_theme_family"
export const THEME_TRANSITION_CLASS = "theme-changing"
export const THEME_TRANSITION_DURATION_MS = 240

export type ThemeConfig = {
  family?: ThemeFamily
  mode?: ThemeMode
}

export const DEFAULT_THEME: Required<ThemeConfig> = {
  family: "default",
  mode: "light",
}

export function resolveThemeFamily(family?: string | null): ThemeFamily {
  return family === "terra" ? "terra" : "default"
}

export function getThemeConfigFromStoredFamily(
  family?: string | null
): Required<ThemeConfig> {
  return getThemeConfigForFamily(resolveThemeFamily(family))
}

export function getThemeConfigForFamily(
  family: ThemeFamily
): Required<ThemeConfig> {
  if (family === "terra") {
    return {
      family: "terra",
      mode: "dark",
    }
  }

  return DEFAULT_THEME
}

export function getThemeConfigFromUser(
  user: User | null | undefined
): Required<ThemeConfig> {
  return getThemeConfigFromStoredFamily(user?.user_metadata?.theme_family)
}

const themeTransitionTimerKey = "__orchestraThemeTransitionTimer"

type ThemeTransitionWindow = Window & {
  [themeTransitionTimerKey]?: number
}

export function applyThemeToDocument(theme: Required<ThemeConfig>) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.dataset.themeFamily = theme.family
  root.dataset.themeMode = theme.mode
}

export function startThemeTransition(themeFamily: ThemeFamily) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return
  }

  const nextTheme = getThemeConfigForFamily(themeFamily)
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

  applyThemeToDocument(nextTheme)

  if (prefersReducedMotion) {
    document.documentElement.classList.remove(THEME_TRANSITION_CLASS)
    return
  }

  const root = document.documentElement
  const existingTimer = (window as typeof window & {
    [themeTransitionTimerKey]?: number
  })[themeTransitionTimerKey]

  if (existingTimer) {
    window.clearTimeout(existingTimer)
  }

  root.classList.add(THEME_TRANSITION_CLASS)

  ;(window as ThemeTransitionWindow)[themeTransitionTimerKey] = window.setTimeout(() => {
    root.classList.remove(THEME_TRANSITION_CLASS)
  }, THEME_TRANSITION_DURATION_MS)
}
