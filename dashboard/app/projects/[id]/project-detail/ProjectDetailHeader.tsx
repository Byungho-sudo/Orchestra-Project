import type { Project } from "@/lib/projects"
import { detailCardClassName } from "./helpers"

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

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Progress
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {project.progress}%
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Due Date
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {project.due_date ?? "No due date"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
