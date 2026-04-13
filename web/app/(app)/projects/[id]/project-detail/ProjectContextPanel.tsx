import {
  getDeadlineBadgeClass,
  getDeadlineBarClass,
  getDeadlineFill,
  getDeadlineStatus,
} from "@/lib/project-deadline"
import type { Project } from "@/lib/projects"
import {
  detailCardClassName,
  fieldCardClassName,
} from "./helpers"

export function ProjectContextPanel({
  currentProject,
  onDeleteProject,
  onEditMetadata,
  onEditProject,
}: {
  currentProject: Project
  onDeleteProject: () => void
  onEditMetadata: () => void
  onEditProject: () => void
}) {
  const deadlineStatus = getDeadlineStatus(currentProject.due_date)

  return (
    <aside
      className={`${detailCardClassName} h-fit self-start`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-card-muted-foreground)]">
        Project Context
      </p>

      <div className="mt-6 space-y-4">
        <div className={fieldCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-card-muted-foreground)]">
            Visibility
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--theme-card-foreground)]">
            {currentProject.visibility}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--theme-card)] p-5 shadow-[var(--color-card-shadow)]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--theme-card-foreground)]">
              Progress Bar
            </span>
            <span className="text-sm font-medium text-[var(--color-card-muted-foreground)]">
              {currentProject.progress}%
            </span>
          </div>

          <div className="h-3 rounded-full bg-[var(--color-card-progress-track)]">
            <div
              className="h-full rounded-full bg-[var(--color-status-success)] transition-all"
              style={{ width: `${currentProject.progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--theme-card)] p-5 shadow-[var(--color-card-shadow)]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--theme-card-foreground)]">
              Deadline Bar
            </span>
            <span className="text-sm font-medium text-[var(--color-card-muted-foreground)]">
              {deadlineStatus}
            </span>
          </div>

          <div className="h-3 rounded-full bg-[var(--color-card-deadline-track)]">
            <div
              className={`h-full rounded-full transition-all ${getDeadlineBarClass(
                deadlineStatus
              )}`}
              style={{ width: `${getDeadlineFill(currentProject.due_date)}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-[var(--color-card-muted-foreground)]">
            {currentProject.due_date
              ? `Due ${currentProject.due_date}`
              : "No due date"}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDeadlineBadgeClass(
                deadlineStatus
              )}`}
            >
              {deadlineStatus}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-card-muted-foreground)]">
            Primary Actions
          </p>

          <button
            onClick={onEditProject}
            className="inline-flex w-full justify-center rounded-lg bg-[var(--theme-primary)] px-4 py-2 text-sm font-medium text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary-hover)]"
          >
            Edit Project
          </button>

          <button
            onClick={onEditMetadata}
            className="inline-flex w-full justify-center rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm font-medium text-[var(--theme-card-foreground)] hover:bg-[var(--color-background)]"
          >
            Edit Metadata
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-card-muted-foreground)]">
            Secondary Action
          </p>

          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed justify-center rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] opacity-70"
          >
            Archive Project
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-card-muted-foreground)]">
            Destructive Action
          </p>

          <button
            onClick={onDeleteProject}
            className="inline-flex w-full justify-center rounded-lg bg-[var(--color-status-danger)] px-4 py-2 text-sm font-medium text-[var(--theme-primary-foreground)] hover:brightness-105"
          >
            Delete Project
          </button>
        </div>
      </div>
    </aside>
  )
}
