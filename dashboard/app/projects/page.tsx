import { Suspense } from "react"
import { AppShell } from "@/app/components/project-dashboard/AppShell"
import { ProjectsGrid } from "@/app/components/project-dashboard/ProjectsGrid"
import { ProjectsGridSkeleton } from "@/app/components/project-dashboard/ProjectsGridSkeleton"

export default function ProjectsPage() {
  return (
    <AppShell title="Projects">
      <Suspense fallback={<ProjectsGridSkeleton />}>
        <ProjectsGrid />
      </Suspense>
    </AppShell>
  )
}
