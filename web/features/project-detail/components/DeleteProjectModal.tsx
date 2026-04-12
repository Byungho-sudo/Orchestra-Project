"use client"

import { ProjectModalShell } from "@/features/projects/ProjectModalShell"

type DeleteProjectModalProps = {
  deleteError: string
  isDeleting: boolean
  isOpen: boolean
  onClose: () => void
  onConfirmDelete: () => void
  projectName: string
}

export function DeleteProjectModal({
  deleteError,
  isDeleting,
  isOpen,
  onClose,
  onConfirmDelete,
  projectName,
}: DeleteProjectModalProps) {
  if (!isOpen) return null

  return (
    <ProjectModalShell
      isDismissDisabled={isDeleting}
      panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClose={onClose}
    >
      {({ requestClose }) => (
        <>
          <h3 className="text-lg font-semibold text-slate-900">
            Delete Project
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">{projectName}</span>?
            This action cannot be undone.
          </p>

          {deleteError && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {deleteError}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isDeleting}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        </>
      )}
    </ProjectModalShell>
  )
}
