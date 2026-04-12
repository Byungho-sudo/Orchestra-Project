"use client"

import {
  getDeadlineBadgeClass,
  getDeadlineBarClass,
  getDeadlineFill,
  getDeadlineStatus,
} from "@/lib/project-deadline"
import type { Project } from "@/lib/projects"
import type { ThemeFamily } from "@/lib/theme"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"

export function ProjectCard({
  project,
  themeFamily,
  onOpenProject,
}: {
  project: Project
  themeFamily: ThemeFamily
  onOpenProject: () => void
}) {
  const deadlineStatus = getDeadlineStatus(project.due_date)
  const isTerra = themeFamily === "terra"
  const titleClassName = isTerra
    ? "text-[17px] font-semibold leading-[1.2] tracking-[-0.01em] text-[var(--theme-card-foreground)]"
    : "text-base font-semibold leading-tight text-[var(--theme-card-foreground)]"
  const descriptionClassName = isTerra
    ? "mt-1.5 min-h-[2.5rem] text-sm leading-6 text-[var(--color-card-muted-foreground)]"
    : "mt-1 min-h-[2.5rem] text-sm leading-5 text-[var(--color-card-muted-foreground)]"
  const contentStackClassName = isTerra ? "mt-4 space-y-4" : "mt-3.5 space-y-3.5"
  const meterLabelClassName = isTerra
    ? "mb-1.5 flex justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-card-muted-foreground)]"
    : "mb-2 flex justify-between text-sm font-normal text-[var(--color-card-muted-foreground)]"
  const trackClassName = isTerra
    ? "h-1.5 rounded-full"
    : "h-2 rounded-full"
  const dueSectionClassName = isTerra
    ? "border-t border-[var(--color-card-separator)] pt-3"
    : "border-t border-[var(--color-card-separator)] pt-2.5"
  const dueRowClassName = isTerra
    ? "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-card-muted-foreground)]"
    : "flex items-center gap-2 text-sm font-normal text-[var(--color-card-muted-foreground)]"
  const pillClassName = isTerra
    ? "border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] shadow-[var(--color-card-pill-shadow)]"
    : "border px-2 py-0.5 text-xs font-medium"

  return (
    <Card
      as="article"
      onClick={onOpenProject}
      className="cursor-pointer bg-[var(--theme-card)] transition hover:shadow-[var(--color-card-shadow-hover)]"
    >
      <h3 className={titleClassName}>
        {project.name}
      </h3>
      <p className={descriptionClassName}>
        {project.description?.trim() || "No description provided."}
      </p>

      <div className={contentStackClassName}>
        <div>
          <div className={meterLabelClassName}>
            <span>Progress Bar</span>
            <span>{project.progress}%</span>
          </div>
          <div className={`${trackClassName} bg-[var(--color-card-progress-track)]`}>
            <div
              className="h-full rounded-full bg-[var(--color-status-success)]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div>
          <div className={meterLabelClassName}>
            <span>Deadline Bar</span>
            <span>{deadlineStatus}</span>
          </div>
          <div className={`${trackClassName} bg-[var(--color-card-deadline-track)]`}>
            <div
              className={`h-full rounded-full ${getDeadlineBarClass(
                deadlineStatus
              )}`}
              style={{ width: `${getDeadlineFill(project.due_date)}%` }}
            />
          </div>
        </div>

        <div className={dueSectionClassName}>
          <p className={dueRowClassName}>
            <span>Due {project.due_date ?? "No due date"}</span>
            <Badge
              className={`${pillClassName} ${getDeadlineBadgeClass(
                deadlineStatus
              )}`}
            >
              {deadlineStatus}
            </Badge>
          </p>
        </div>

      </div>
    </Card>
  )
}
