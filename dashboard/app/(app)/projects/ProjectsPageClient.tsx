"use client"

import { Suspense, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { ProjectsGrid } from "@/features/projects/ProjectsGrid"
import { ProjectsGridSkeleton } from "@/features/projects/ProjectsGridSkeleton"

export default function ProjectsPageClient() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)

  return (
    <AppShell title="Projects">
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
