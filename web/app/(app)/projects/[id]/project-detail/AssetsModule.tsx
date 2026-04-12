"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ProjectModalShell } from "@/features/projects/ProjectModalShell"
import { fieldCardClassName, isProjectModuleInstanceId } from "./helpers"
import {
  emptyProjectAssetDraft,
  useProjectAssets,
  type ProjectAssetCategory,
  type ProjectAssetDraft,
  type ProjectAssetRecord,
} from "./hooks/useProjectAssets"

const assetCategoryOptions: Array<{
  label: string
  value: ProjectAssetCategory
}> = [
  { label: "Document", value: "document" },
  { label: "Link", value: "link" },
  { label: "File", value: "file" },
  { label: "Image", value: "image" },
  { label: "Other", value: "other" },
]

function createAssetDraft(asset?: ProjectAssetRecord | null): ProjectAssetDraft {
  if (!asset) return emptyProjectAssetDraft

  return {
    name: asset.name,
    url: asset.url ?? "",
    description: asset.description ?? "",
    category: asset.category,
  }
}

function getOpenableAssetUrl(url: string) {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) return ""

  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
}

function getAssetCategoryLabel(category: ProjectAssetCategory) {
  return (
    assetCategoryOptions.find((option) => option.value === category)?.label ??
    category
  )
}

const assetsFormId = "assets-module-form"

export function AssetsModule({
  moduleId,
  projectId,
}: {
  moduleId: string | null
  projectId: number
}) {
  const persistedModuleId = isProjectModuleInstanceId(moduleId ?? "")
  const {
    assets,
    createAsset,
    deleteAsset,
    error,
    isCreating,
    isLoading,
    moveAsset,
    movingAssetId,
    savingAssetId,
    schemaUnavailableMessage,
    updateAsset,
  } = useProjectAssets({
    enabled: persistedModuleId,
    moduleId: persistedModuleId ? moduleId : null,
    projectId,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<ProjectAssetRecord | null>(
    null
  )
  const [draft, setDraft] = useState<ProjectAssetDraft>(emptyProjectAssetDraft)
  const primaryInputRef = useRef<HTMLInputElement | null>(null)

  const hasDraftChanges = useMemo(() => {
    const initialDraft = createAssetDraft(editingAsset)

    return JSON.stringify(draft) !== JSON.stringify(initialDraft)
  }, [draft, editingAsset])

  const openCreateModal = useCallback(() => {
    setEditingAsset(null)
    setDraft({
      ...emptyProjectAssetDraft,
      category: "link",
    })
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((asset: ProjectAssetRecord) => {
    setEditingAsset(asset)
    setDraft(createAssetDraft(asset))
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (isCreating || Boolean(savingAssetId)) return

    setIsModalOpen(false)
    setEditingAsset(null)
    setDraft(emptyProjectAssetDraft)
  }, [isCreating, savingAssetId])

  useEffect(() => {
    if (!isModalOpen) return

    const focusTimeout = setTimeout(() => {
      primaryInputRef.current?.focus()
      primaryInputRef.current?.select()
    }, 0)

    return () => {
      clearTimeout(focusTimeout)
    }
  }, [editingAsset, isModalOpen])

  const handleDraftChange = useCallback(
    (field: keyof ProjectAssetDraft, value: string) => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        [field]: value,
      }))
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    const didSave = editingAsset
      ? await updateAsset(editingAsset.id, draft)
      : await createAsset(draft)

    if (didSave) {
      if (editingAsset) {
        closeModal()
        return
      }

      setDraft({
        ...emptyProjectAssetDraft,
        category: draft.category,
      })
      primaryInputRef.current?.focus()
    }
  }, [closeModal, createAsset, draft, editingAsset, updateAsset])

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Assets
        </p>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={
            !persistedModuleId || isCreating || Boolean(schemaUnavailableMessage)
          }
          className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Asset
        </button>
      </div>

      {!persistedModuleId && (
        <p className="mt-4 text-sm text-slate-500">
          Assets are still syncing to the saved workspace module.
        </p>
      )}

      {schemaUnavailableMessage && (
        <p className="mt-4 text-sm font-medium text-amber-700">
          {schemaUnavailableMessage}
        </p>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading assets...</p>
        ) : assets.length === 0 ? (
          <div className={fieldCardClassName}>
            <p className="text-sm text-slate-500">
              No assets added yet. Add documents, links, and references for this
              project.
            </p>
          </div>
        ) : (
          assets.map((asset, assetIndex) => (
            <div
              key={asset.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">
                    {asset.name}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {getAssetCategoryLabel(asset.category)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  {asset.url?.trim() ? (
                    <a
                      href={getOpenableAssetUrl(asset.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                      Open
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => openEditModal(asset)}
                    disabled={Boolean(savingAssetId)}
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void moveAsset(asset.id, "up")}
                    disabled={assetIndex === 0 || movingAssetId === asset.id}
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Move Up
                  </button>

                  <button
                    type="button"
                    onClick={() => void moveAsset(asset.id, "down")}
                    disabled={
                      assetIndex === assets.length - 1 ||
                      movingAssetId === asset.id
                    }
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Move Down
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteAsset(asset.id)}
                    disabled={savingAssetId === asset.id}
                    className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAssetId === asset.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {asset.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {asset.description}
                </p>
              )}

              {asset.url?.trim() && (
                <p className="mt-3 truncate text-xs text-slate-500">
                  {getOpenableAssetUrl(asset.url)}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ProjectModalShell
          hasUnsavedChanges={hasDraftChanges}
          isDismissDisabled={isCreating || Boolean(savingAssetId)}
          panelClassName="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeModal}
        >
          {({ requestClose }) => (
            <>
              <h2 className="text-xl font-bold text-slate-900">
                {editingAsset ? "Edit Asset" : "Add Asset"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Track documents, links, and project resources in one place.
              </p>

              <form
                id={assetsFormId}
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSubmit()
                }}
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Asset Name
                  </label>
                  <input
                    ref={primaryInputRef}
                    type="text"
                    value={draft.name}
                    onChange={(event) =>
                      handleDraftChange("name", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      handleDraftChange("category", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {assetCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    URL
                  </label>
                  <input
                    type="text"
                    value={draft.url}
                    onChange={(event) =>
                      handleDraftChange("url", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={draft.description}
                    onChange={(event) =>
                      handleDraftChange("description", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </form>

              {error && (
                <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isCreating || Boolean(savingAssetId)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form={assetsFormId}
                  disabled={isCreating || Boolean(savingAssetId)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating || Boolean(savingAssetId)
                    ? "Saving..."
                    : editingAsset
                      ? "Save Changes"
                      : "Add Asset"}
                </button>
              </div>
            </>
          )}
        </ProjectModalShell>
      )}
    </>
  )
}
