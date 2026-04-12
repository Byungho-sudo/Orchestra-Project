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

export function ProjectMobileContext({
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
    <details className={`lg:hidden ${detailCardClassName} p-0`}>
      <summary className="cursor-pointer list-none px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Project Summary
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-slate-900">
            Project Context
          </p>
          <span className="text-sm font-medium text-slate-500">
            Tap to expand
          </span>
        </div>
      </summary>

      <div className="border-t border-slate-200 px-5 pb-5 pt-4">
        <div className="space-y-4">
          <div className={fieldCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visibility
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {currentProject.visibility}
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
                {deadlineStatus}
              </span>
            </div>

            <div className="h-3 rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${getDeadlineBarClass(
                  deadlineStatus
                )}`}
                style={{ width: `${getDeadlineFill(currentProject.due_date)}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
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

          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-400 opacity-70"
          >
            Archive Project
          </button>

          <button
            onClick={onDeleteProject}
            className="inline-flex w-full justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
          >
            Delete Project
          </button>
        </div>
      </div>
    </details>
  )
}
