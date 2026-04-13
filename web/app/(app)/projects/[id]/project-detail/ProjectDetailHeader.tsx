import type { Project } from "@/lib/projects"
import { detailCardClassName } from "./helpers"

function formatProjectDate(value: string | null) {
  if (!value) return "No due date"

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toISOString().slice(0, 10)
}

export function ProjectDetailHeader({
  project,
}: {
  project: Project
}) {
  return (
    <div className={detailCardClassName}>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-card-muted-foreground)]">
          Project Detail
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[var(--theme-card-foreground)]">
          {project.name}
        </h1>

        <p className="mt-4 text-base leading-7 text-[var(--color-card-muted-foreground)]">
          {project.description?.trim() || "No description provided."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-card-muted-foreground)]">
              Due Date
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--theme-card-foreground)]">
              {formatProjectDate(project.due_date)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-card-muted-foreground)]">
              Created At
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--theme-card-foreground)]">
              {formatProjectDate(project.created_at)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-card-muted-foreground)]">
              Project ID
            </p>
            <p className="mt-2 break-all text-xs font-medium text-[var(--theme-card-foreground)]">
              {project.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
