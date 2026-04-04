"use client"

export function DeleteProjectModal({
  projectName,
  isDeleting,
  onCancel,
  onConfirmDelete,
}: {
  projectName: string
  isDeleting: boolean
  onCancel: () => void
  onConfirmDelete: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Delete Project
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-900">{projectName}</span>?
          This action cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </div>
    </div>
  )
}
