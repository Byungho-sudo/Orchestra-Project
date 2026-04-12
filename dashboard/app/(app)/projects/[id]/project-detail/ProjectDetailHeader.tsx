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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Project Detail
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {project.name}
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600">
          {project.description?.trim() || "No description provided."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Due Date
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatProjectDate(project.due_date)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Created At
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatProjectDate(project.created_at)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Project ID
            </p>
            <p className="mt-2 break-all text-xs font-medium text-slate-700">
              {project.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
