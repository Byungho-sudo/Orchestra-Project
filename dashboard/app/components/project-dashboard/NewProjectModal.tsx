"use client"

import type { ProjectFormErrors } from "@/lib/project-validation"
import type { ProjectVisibility } from "@/lib/projects"
import { ModalShell } from "@/app/components/project-dashboard/ModalShell"

export function NewProjectModal({
  name,
  description,
  dueDate,
  visibility,
  canCreatePrivate,
  errors,
  isSaving,
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
  errors: ProjectFormErrors
  isSaving: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onVisibilityChange: (value: ProjectVisibility) => void
  onCancel: () => void
  onCreateProject: () => void
}) {
  return (
    <ModalShell
      hasUnsavedChanges={Boolean(
        name.trim() || description.trim() || dueDate || visibility !== "public"
      )}
      isDismissDisabled={isSaving}
      panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClose={onCancel}
    >
      {({ requestClose }) => (
        <>
        <h3 className="text-lg font-semibold">New Project</h3>
        <p className="mt-1 text-sm text-slate-600">
          Add a new project card to the dashboard.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Project name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Project description"
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => onDueDateChange(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
            {errors.due_date && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.due_date}
              </p>
            )}
          </div>

          <div>
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
            {errors.visibility && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.visibility}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreateProject}
            disabled={isSaving || !name.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Creating..." : "Create Project"}
          </button>
        </div>
        </>
      )}
    </ModalShell>
  )
}
