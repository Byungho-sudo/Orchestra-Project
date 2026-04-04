"use client"

import type { ProjectVisibility } from "@/lib/projects"

export function NewProjectModal({
  name,
  description,
  dueDate,
  visibility,
  canCreatePrivate,
  onNameChange,
  onDescriptionChange,
  onDueDateChange,
  onVisibilityChange,
  onCancel,
  onCreateProject,
}: {
  name: string
  description: string
  dueDate: string
  visibility: ProjectVisibility
  canCreatePrivate: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onVisibilityChange: (value: ProjectVisibility) => void
  onCancel: () => void
  onCreateProject: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">New Project</h3>
        <p className="mt-1 text-sm text-slate-600">
          Add a new project card to the dashboard.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Project name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Project description"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
          <select
            value={visibility}
            onChange={(event) =>
              onVisibilityChange(event.target.value as ProjectVisibility)
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-500 focus:ring-2"
          >
            <option value="public">Public</option>
            <option value="private" disabled={!canCreatePrivate}>
              Private
            </option>
          </select>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onCreateProject}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}
