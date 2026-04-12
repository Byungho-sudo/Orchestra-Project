"use client"

import { Suspense, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { ProjectsGrid } from "@/features/projects/ProjectsGrid"
import { ProjectsGridSkeleton } from "@/features/projects/ProjectsGridSkeleton"
import type { ThemeConfig } from "@/lib/theme"

export default function ProjectsPageContent({
  initialTheme,
}: {
  initialTheme?: ThemeConfig
}) {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)

  return (
    <AppShell title="Projects" theme={initialTheme}>
      <Suspense fallback={<ProjectsGridSkeleton />}>
        <ProjectsGrid
          isCreateProjectOpen={isCreateProjectOpen}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          onCloseCreateProject={() => setIsCreateProjectOpen(false)}
        />
      </Suspense>
    </AppShell>
  )
}
