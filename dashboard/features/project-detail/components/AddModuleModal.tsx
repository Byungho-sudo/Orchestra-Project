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

type AddModuleModalProps = {
  addModuleFormId: string
  clearModuleError: () => void
  createModuleForm: CreateProjectModuleForm
  customProjectModuleOptions: ModuleOption[]
  hasUnsavedChanges: boolean
  isCreatingModule: boolean
  isOpen: boolean
  moduleError: string
  onClose: () => void
  onCreate: () => void
  setCreateModuleForm: Dispatch<SetStateAction<CreateProjectModuleForm>>
}

export function AddModuleModal({
  addModuleFormId,
  clearModuleError,
  createModuleForm,
  customProjectModuleOptions,
  hasUnsavedChanges,
  isCreatingModule,
  isOpen,
  moduleError,
  onClose,
  onCreate,
  setCreateModuleForm,
}: AddModuleModalProps) {
  if (!isOpen) return null

  return (
    <ProjectModalShell
      hasUnsavedChanges={hasUnsavedChanges}
      isDismissDisabled={isCreatingModule}
      panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      onClose={onClose}
    >
      {({ requestClose }) => (
        <>
          <h2 className="text-xl font-bold text-slate-900">Add Module</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create a new workspace module in the center column.
          </p>

          <form
            id={addModuleFormId}
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              onCreate()
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Module Title
              </label>
              <input
                type="text"
                value={createModuleForm.title}
                onChange={(event) => {
                  setCreateModuleForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                  if (moduleError && event.target.value.trim()) {
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
                value={createModuleForm.type}
                onChange={(event) =>
                  setCreateModuleForm((current) => ({
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
          </form>

          {moduleError && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {moduleError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={isCreatingModule}
              className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form={addModuleFormId}
              disabled={isCreatingModule || !createModuleForm.title.trim()}
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {isCreatingModule ? "Creating..." : "Create Module"}
            </button>
          </div>
        </>
      )}
    </ProjectModalShell>
  )
}
