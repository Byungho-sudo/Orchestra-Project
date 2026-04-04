"use client"

import type { ProjectFormErrors } from "@/lib/project-validation"
import { ModalShell } from "@/app/components/project-dashboard/ModalShell"

export function EditProjectModal({
  editName,
  editDescription,
  editDueDate,
  errors,
  isSaving,
  onEditNameChange,
  onEditDescriptionChange,
  onEditDueDateChange,
  onCancel,
  onSaveProject,
  hasUnsavedChanges = false,
}: {
  editName: string
  editDescription: string
  editDueDate: string
  errors: ProjectFormErrors
  isSaving: boolean
  onEditNameChange: (value: string) => void
  onEditDescriptionChange: (value: string) => void
  onEditDueDateChange: (value: string) => void
  onCancel: () => void
  onSaveProject: () => void
  hasUnsavedChanges?: boolean
}) {
  return (
    <ModalShell
      hasUnsavedChanges={hasUnsavedChanges}
      isDismissDisabled={isSaving}
      panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClose={onCancel}
    >
      {({ requestClose }) => (
        <>
        <h3 className="text-lg font-semibold">Edit Project</h3>
        <p className="mt-1 text-sm text-slate-600">
          Update this project&apos;s information.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <input
              value={editName}
              onChange={(event) => onEditNameChange(event.target.value)}
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
              value={editDescription}
              onChange={(event) => onEditDescriptionChange(event.target.value)}
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
              value={editDueDate}
              onChange={(event) => onEditDueDateChange(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
            {errors.due_date && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.due_date}
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
            onClick={onSaveProject}
            disabled={isSaving || !editName.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        </>
      )}
    </ModalShell>
  )
}
