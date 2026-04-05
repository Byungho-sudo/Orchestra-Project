import type { Project, ProjectMetadata } from "@/lib/projects"
import {
  detailCardClassName,
  fieldCardClassName,
} from "./helpers"

export function ProjectContextPanel({
  contextMetadata,
  deadlineFill,
  currentProject,
  deadlineBadge,
  onDeleteProject,
  onEditMetadata,
  onEditProject,
}: {
  contextMetadata: ProjectMetadata[]
  deadlineFill: number
  currentProject: Project
  deadlineBadge: {
    className: string
    fillClassName: string
    label: string
  }
  onDeleteProject: () => void
  onEditMetadata: () => void
  onEditProject: () => void
}) {
  return (
    <aside className={`${detailCardClassName} lg:sticky lg:top-6`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Project Context
      </p>

      <div className="mt-6 space-y-4">
        <div className={fieldCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {currentProject.status}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Progress Bar
            </span>
            <span className="text-sm font-medium text-slate-600">
              {currentProject.progress}%
            </span>
          </div>

          <div className="h-3 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-green-700 transition-all"
              style={{ width: `${currentProject.progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Deadline Bar
            </span>
            <span className="text-sm font-medium text-slate-600">
              {deadlineBadge.label}
            </span>
          </div>

          <div className="h-3 rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${deadlineBadge.fillClassName}`}
              style={{ width: `${deadlineFill}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {currentProject.due_date
              ? `Due ${currentProject.due_date}`
              : "No due date"}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${deadlineBadge.className}`}
            >
              {deadlineBadge.label}
            </span>
          </p>
        </div>

        <div className={fieldCardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Created At
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {new Date(currentProject.created_at).toLocaleDateString()}
          </p>
        </div>

        {contextMetadata.map((metadata) => (
          <div key={metadata.id} className={fieldCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {metadata.key}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {metadata.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Primary Actions
          </p>

          <button
            onClick={onEditProject}
            className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Edit Project
          </button>

          <button
            onClick={onEditMetadata}
            className="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit Metadata
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Secondary Action
          </p>

          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-400 opacity-70"
          >
            Archive Project
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Destructive Action
          </p>

          <button
            onClick={onDeleteProject}
            className="inline-flex w-full justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
          >
            Delete Project
          </button>
        </div>
      </div>
    </aside>
  )
}
