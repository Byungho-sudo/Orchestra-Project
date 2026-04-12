import { cookies } from "next/headers"
import { AppShell } from "@/components/layout/AppShell"
import { ProjectsGridSkeleton } from "@/features/projects/ProjectsGridSkeleton"
import {
  getThemeConfigFromStoredFamily,
  THEME_FAMILY_COOKIE,
} from "@/lib/theme"

export default async function ProjectsLoading() {
  const cookieStore = await cookies()
  const themeFamily = cookieStore.get(THEME_FAMILY_COOKIE)?.value
  const theme = getThemeConfigFromStoredFamily(themeFamily)

  return (
    <AppShell title="Projects" theme={theme}>
      <ProjectsGridSkeleton />
    </AppShell>
  )
}
