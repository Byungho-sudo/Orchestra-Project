import type { User } from "@supabase/supabase-js"

export type ThemeFamily = "default" | "terra"
export type ThemeMode = "light" | "dark"
export const THEME_FAMILY_COOKIE = "orchestra_theme_family"

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
