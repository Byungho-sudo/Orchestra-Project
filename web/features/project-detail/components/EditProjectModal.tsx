"use client"

import type { Dispatch, SetStateAction } from "react"
import type { ProjectVisibility } from "@/lib/projects"
import type { ProjectFormErrors } from "@/lib/project-validation"
import { ProjectModalShell } from "@/features/projects/ProjectModalShell"
import { isEnterCommitEvent } from "@/app/(app)/projects/[id]/project-detail/helpers"
import type { ProjectEditForm } from "@/app/(app)/projects/[id]/project-detail/hooks/useProjectMutations"

type EditProjectModalProps = {
  editForm: ProjectEditForm
  editProjectFormId: string
  hasUnsavedChanges: boolean
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSave: () => void
  saveError: string
  saveFieldErrors: ProjectFormErrors
  setEditForm: Dispatch<SetStateAction<ProjectEditForm>>
  setSaveFieldErrors: Dispatch<SetStateAction<ProjectFormErrors>>
}

export function EditProjectModal({
  editForm,
  editProjectFormId,
  hasUnsavedChanges,
  isOpen,
  isSaving,
  onClose,
  onSave,
  saveError,
  saveFieldErrors,
  setEditForm,
  setSaveFieldErrors,
}: EditProjectModalProps) {
  if (!isOpen) return null

  return (
    <ProjectModalShell
      hasUnsavedChanges={hasUnsavedChanges}
      isDismissDisabled={isSaving}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      onClose={onClose}
    >
      {({ requestClose }) => (
        <>
          <h2 className="text-xl font-bold text-slate-900">Edit Project</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update the project details below.
          </p>

          <form
            id={editProjectFormId}
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSave()
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(event) => {
                  setEditForm({ ...editForm, name: event.target.value })
                  setSaveFieldErrors((current) => ({
                    ...current,
                    name: undefined,
                  }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              />
              {saveFieldErrors.name && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {saveFieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                rows={4}
                value={editForm.description}
                onChange={(event) => {
                  setEditForm({
                    ...editForm,
                    description: event.target.value,
                  })
                  setSaveFieldErrors((current) => ({
                    ...current,
                    description: undefined,
                  }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              />
              {saveFieldErrors.description && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {saveFieldErrors.description}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Due Date
              </label>
              <input
                type="date"
                value={editForm.due_date}
                onChange={(event) => {
                  setEditForm({ ...editForm, due_date: event.target.value })
                  setSaveFieldErrors((current) => ({
                    ...current,
                    due_date: undefined,
                  }))
                }}
                onKeyDown={(event) => {
                  if (!isEnterCommitEvent(event)) return

                  event.preventDefault()
                  onSave()
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              />
              {saveFieldErrors.due_date && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {saveFieldErrors.due_date}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Visibility
              </label>
              <select
                value={editForm.visibility}
                onChange={(event) => {
                  setEditForm({
                    ...editForm,
                    visibility: event.target.value as ProjectVisibility,
                  })
                  setSaveFieldErrors((current) => ({
                    ...current,
                    visibility: undefined,
                  }))
                }}
                onKeyDown={(event) => {
                  if (!isEnterCommitEvent(event)) return

                  event.preventDefault()
                  onSave()
                }}
                className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
              {saveFieldErrors.visibility && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {saveFieldErrors.visibility}
                </p>
              )}
            </div>

            {saveError && (
              <p className="text-sm font-medium text-red-600">{saveError}</p>
            )}
          </form>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSaving}
              className="inline-flex cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              form={editProjectFormId}
              disabled={isSaving || !editForm.name.trim()}
              className="inline-flex cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </ProjectModalShell>
  )
}
