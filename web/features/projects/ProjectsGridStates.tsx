"use client"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

export function ProjectsEmptyState({
  onCreateProject,
}: {
  onCreateProject: () => void
}) {
  return (
    <Card padding="lg" className="text-center">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        No projects yet
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Create your first project to start building your dashboard.
      </p>
      <Button onClick={onCreateProject} className="mt-4">
        Create First Project
      </Button>
    </Card>
  )
}

export function ProjectsNoMatchesState({
  hasSearchQuery,
}: {
  hasSearchQuery: boolean
}) {
  return (
    <Card padding="lg" className="text-center">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        No matching projects
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {hasSearchQuery
          ? "No projects match your current search."
          : "No projects match your selected deadline filter."}
      </p>
    </Card>
  )
}
