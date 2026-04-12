"use client"

import type { Dispatch, SetStateAction } from "react"
import { ProjectModalShell } from "@/features/projects/ProjectModalShell"
import type {
  CreateProjectModuleForm,
  ProjectModuleType,
} from "@/app/(app)/projects/[id]/project-detail/types"

type ModuleOption = {
  label: string
  value: ProjectModuleType
}

type EditModuleModalProps = {
  customProjectModuleOptions: ModuleOption[]
  editModuleForm: CreateProjectModuleForm
  editModuleFormId: string
  hasUnsavedChanges: boolean
  isOpen: boolean
  isUpdatingModule: boolean
  moduleError: string
  onClose: () => void
  onSave: () => void
  setEditModuleForm: Dispatch<SetStateAction<CreateProjectModuleForm>>
  clearModuleError: () => void
}

export function EditModuleModal({
  clearModuleError,
  customProjectModuleOptions,
  editModuleForm,
  editModuleFormId,
  hasUnsavedChanges,
  isOpen,
  isUpdatingModule,
  moduleError,
  onClose,
  onSave,
  setEditModuleForm,
}: EditModuleModalProps) {
  if (!isOpen) return null

  return (
    <ProjectModalShell
      hasUnsavedChanges={hasUnsavedChanges}
      isDismissDisabled={isUpdatingModule}
      panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      onClose={onClose}
    >
      {({ requestClose }) => (
        <>
          <h2 className="text-xl font-bold text-slate-900">Edit Module</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update the selected module title and behavior type.
          </p>

          <form
            id={editModuleFormId}
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSave()
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Module Title
              </label>
              <input
                type="text"
                value={editModuleForm.title}
                onChange={(event) => {
                  setEditModuleForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                  if (moduleError) {
                    clearModuleError()
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Module Type
              </label>
              <select
                value={editModuleForm.type}
                onChange={(event) =>
                  setEditModuleForm((current) => ({
                    ...current,
                    type: event.target.value as ProjectModuleType,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              >
                {customProjectModuleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {moduleError && (
              <p className="text-sm font-medium text-red-600">{moduleError}</p>
            )}
          </form>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => requestClose()}
              disabled={isUpdatingModule}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              form={editModuleFormId}
              disabled={isUpdatingModule || !hasUnsavedChanges}
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingModule ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </ProjectModalShell>
  )
}
