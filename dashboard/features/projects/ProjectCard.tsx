"use client"

import {
  getDeadlineBadgeClass,
  getDeadlineBarClass,
  getDeadlineFill,
  getDeadlineStatus,
} from "@/lib/project-deadline"
import type { Project } from "@/lib/projects"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"

export function ProjectCard({
  project,
  onOpenProject,
}: {
  project: Project
  onOpenProject: () => void
}) {
  const deadlineStatus = getDeadlineStatus(project.due_date)

  return (
    <Card
      as="article"
      onClick={onOpenProject}
      className="cursor-pointer transition hover:shadow-[var(--shadow-md)]"
    >
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
        {project.name}
      </h3>
      <p className="mt-1 min-h-[2.5rem] text-sm text-[var(--color-text-secondary)]">
        {project.description?.trim() || "No description provided."}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs font-medium text-[var(--color-text-secondary)]">
            <span>Progress Bar</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[var(--color-success)]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-medium text-[var(--color-text-secondary)]">
            <span>Deadline Bar</span>
            <span>{deadlineStatus}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${getDeadlineBarClass(
                deadlineStatus
              )}`}
              style={{ width: `${getDeadlineFill(project.due_date)}%` }}
            />
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Due {project.due_date ?? "No due date"}
          <Badge
            className={`text-[10px] normal-case tracking-normal ${getDeadlineBadgeClass(
              deadlineStatus
            )}`}
          >
            {deadlineStatus}
          </Badge>
        </p>

      </div>
    </Card>
  )
}
