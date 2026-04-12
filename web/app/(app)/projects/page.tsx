import { cookies } from "next/headers"
import {
  getThemeConfigFromStoredFamily,
  THEME_FAMILY_COOKIE,
} from "@/lib/theme"
import ProjectsPageContent from "./ProjectsPageContent"

export default async function ProjectsPage() {
  const cookieStore = await cookies()
  const themeFamily = cookieStore.get(THEME_FAMILY_COOKIE)?.value
  const initialTheme = getThemeConfigFromStoredFamily(themeFamily)

  return <ProjectsPageContent initialTheme={initialTheme} />
}
