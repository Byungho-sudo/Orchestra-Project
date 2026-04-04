"use client"

import {
  getDeadlineBadgeClass,
  getDeadlineBarClass,
  getDeadlineFill,
  getDeadlineStatus,
} from "@/lib/project-deadline"
import type { Project } from "@/lib/projects"

export function ProjectCard({
  project,
  onOpenProject,
}: {
  project: Project
  onOpenProject: () => void
}) {
  const deadlineStatus = getDeadlineStatus(project.due_date)

  return (
    <article
      onClick={onOpenProject}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <h3 className="text-base font-semibold">{project.name}</h3>
      <p className="mt-1 min-h-[2.5rem] text-sm text-slate-600">
        {project.description?.trim() || "No description provided."}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
            <span>Progress Bar</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-green-700"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
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

        <p className="mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Due {project.due_date ?? "No due date"}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal ${getDeadlineBadgeClass(
              deadlineStatus
            )}`}
          >
            {deadlineStatus}
          </span>
        </p>

      </div>
    </article>
  )
}
