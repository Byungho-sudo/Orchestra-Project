"use client"

import { ProjectModalShell } from "@/features/projects/ProjectModalShell"
import type { ProjectMetadataDraft } from "@/app/(app)/projects/[id]/project-detail/types"

type MetadataSaveState = "idle" | "saving" | "saved" | "error"

type EditMetadataModalProps = {
  addMetadataField: () => void
  deleteMetadataField: (metadataId: string) => void
  hasUnsavedChanges: boolean
  isOpen: boolean
  isSavingMetadata: boolean
  metadataError: string
  metadataForm: ProjectMetadataDraft[]
  metadataSaveState: MetadataSaveState
  onClose: () => void
  onDone: () => void
  updateMetadataField: (
    metadataId: string,
    field: "key" | "value",
    value: string
  ) => void
}

export function EditMetadataModal({
  addMetadataField,
  deleteMetadataField,
  hasUnsavedChanges,
  isOpen,
  isSavingMetadata,
  metadataError,
  metadataForm,
  metadataSaveState,
  onClose,
  onDone,
  updateMetadataField,
}: EditMetadataModalProps) {
  if (!isOpen) return null

  return (
    <ProjectModalShell
      hasUnsavedChanges={hasUnsavedChanges}
      isDismissDisabled={isSavingMetadata}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      panelClassName="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      onClose={onClose}
    >
      {({ requestClose }) => (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Edit Metadata
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Add only the custom fields that are relevant to this project.
              </p>
            </div>

            <p
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                metadataSaveState === "error"
                  ? "text-red-600"
                  : metadataSaveState === "saved"
                    ? "text-emerald-600"
                    : "text-slate-500"
              }`}
            >
              {metadataSaveState === "saving"
                ? "Saving..."
                : metadataSaveState === "saved"
                  ? "Saved"
                  : metadataSaveState === "error"
                    ? "Error"
                    : "Autosave on"}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {metadataForm.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                No custom metadata yet. Add a field to describe what matters
                for this project.
              </div>
            )}

            {metadataForm.map((metadata) => (
              <div
                key={metadata.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,220px)_1fr_auto]"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={metadata.key}
                    onChange={(event) =>
                      updateMetadataField(
                        metadata.id,
                        "key",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Value
                  </label>
                  <textarea
                    rows={2}
                    value={metadata.value}
                    onChange={(event) =>
                      updateMetadataField(
                        metadata.id,
                        "value",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => deleteMetadataField(metadata.id)}
                    className="inline-flex rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMetadataField}
              className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Add Custom Field
            </button>
          </div>

          {metadataError && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {metadataError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSavingMetadata}
              className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onDone}
              disabled={isSavingMetadata}
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingMetadata ? "Saving..." : "Done"}
            </button>
          </div>
        </>
      )}
    </ProjectModalShell>
  )
}
