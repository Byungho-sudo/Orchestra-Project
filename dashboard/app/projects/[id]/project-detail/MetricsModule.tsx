"use client"

import { useCallback, useMemo, useState } from "react"
import { ModalShell } from "@/app/components/project-dashboard/ModalShell"
import { fieldCardClassName, isProjectModuleInstanceId } from "./helpers"
import {
  emptyProjectMetricDraft,
  formatMetricValue,
  getMetricCompletionState,
  getMetricProgress,
  useProjectMetrics,
  type ProjectMetricDraft,
  type ProjectMetricRecord,
} from "./hooks/useProjectMetrics"

function getMetricCompletionBadge(
  completionState: ReturnType<typeof getMetricCompletionState>
) {
  if (completionState === "complete") {
    return {
      className: "bg-green-100 text-green-700",
      label: "Complete",
    }
  }

  if (completionState === "in_progress") {
    return {
      className: "bg-blue-100 text-blue-700",
      label: "In Progress",
    }
  }

  return {
    className: "bg-slate-100 text-slate-600",
    label: "Tracking",
  }
}

function createMetricDraft(metric?: ProjectMetricRecord | null): ProjectMetricDraft {
  if (!metric) return emptyProjectMetricDraft

  return {
    name: metric.name,
    current_value: String(metric.current_value),
    target_value:
      metric.target_value === null ? "" : String(metric.target_value),
    unit: metric.unit ?? "",
  }
}

export function MetricsModule({
  moduleId,
  projectId,
}: {
  moduleId: string
  projectId: number
}) {
  const persistedModuleId = isProjectModuleInstanceId(moduleId)
  const {
    createMetric,
    deleteMetric,
    error,
    isCreating,
    isLoading,
    metrics,
    moveMetric,
    movingMetricId,
    savingMetricId,
    schemaUnavailableMessage,
    updateMetric,
  } = useProjectMetrics({
    enabled: persistedModuleId,
    moduleId: persistedModuleId ? moduleId : null,
    projectId,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<ProjectMetricRecord | null>(
    null
  )
  const [draft, setDraft] = useState<ProjectMetricDraft>(emptyProjectMetricDraft)

  const hasDraftChanges = useMemo(() => {
    const initialDraft = createMetricDraft(editingMetric)

    return JSON.stringify(draft) !== JSON.stringify(initialDraft)
  }, [draft, editingMetric])

  const openCreateModal = useCallback(() => {
    setEditingMetric(null)
    setDraft(emptyProjectMetricDraft)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((metric: ProjectMetricRecord) => {
    setEditingMetric(metric)
    setDraft(createMetricDraft(metric))
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (isCreating || Boolean(savingMetricId)) return

    setIsModalOpen(false)
    setEditingMetric(null)
    setDraft(emptyProjectMetricDraft)
  }, [isCreating, savingMetricId])

  const handleDraftChange = useCallback(
    (field: keyof ProjectMetricDraft, value: string) => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        [field]: value,
      }))
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    const didSave = editingMetric
      ? await updateMetric(editingMetric.id, draft)
      : await createMetric(draft)

    if (didSave) {
      closeModal()
    }
  }, [closeModal, createMetric, draft, editingMetric, updateMetric])

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Metrics
        </p>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={
            !persistedModuleId || isCreating || Boolean(schemaUnavailableMessage)
          }
          className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Metric
        </button>
      </div>

      {!persistedModuleId && (
        <p className="mt-4 text-sm text-slate-500">
          Metrics are still syncing to the saved workspace module.
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
          <p className="text-sm text-slate-500">Loading metrics...</p>
        ) : metrics.length === 0 ? (
          <div className={fieldCardClassName}>
            <p className="text-sm text-slate-500">
              No metrics added yet. Track current progress against a clear target.
            </p>
          </div>
        ) : (
          metrics.map((metric, metricIndex) => {
            const progress = getMetricProgress(metric)
            const completionBadge = getMetricCompletionBadge(
              getMetricCompletionState(metric)
            )

            return (
              <div
                key={metric.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {metric.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatMetricValue(metric)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${completionBadge.className}`}
                  >
                    {completionBadge.label}
                  </span>
                </div>

                {progress !== null && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-[width]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(metric)}
                    disabled={Boolean(savingMetricId)}
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void moveMetric(metric.id, "up")}
                    disabled={metricIndex === 0 || movingMetricId === metric.id}
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Move Up
                  </button>

                  <button
                    type="button"
                    onClick={() => void moveMetric(metric.id, "down")}
                    disabled={
                      metricIndex === metrics.length - 1 ||
                      movingMetricId === metric.id
                    }
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Move Down
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteMetric(metric.id)}
                    disabled={savingMetricId === metric.id}
                    className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingMetricId === metric.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {isModalOpen && (
        <ModalShell
          hasUnsavedChanges={hasDraftChanges}
          isDismissDisabled={isCreating || Boolean(savingMetricId)}
          panelClassName="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeModal}
        >
          {({ requestClose }) => (
            <>
              <h2 className="text-xl font-bold text-slate-900">
                {editingMetric ? "Edit Metric" : "Add Metric"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Track a KPI with a current value, target, and optional unit.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Metric Name
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(event) =>
                      handleDraftChange("name", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Current Value
                    </label>
                    <input
                      type="number"
                      value={draft.current_value}
                      onChange={(event) =>
                        handleDraftChange("current_value", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={draft.target_value}
                      onChange={(event) =>
                        handleDraftChange("target_value", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={draft.unit}
                    onChange={(event) =>
                      handleDraftChange("unit", event.target.value)
                    }
                    placeholder="SEK, chapters, hours..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isCreating || Boolean(savingMetricId)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isCreating || Boolean(savingMetricId)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating || Boolean(savingMetricId)
                    ? "Saving..."
                    : editingMetric
                      ? "Save Changes"
                      : "Add Metric"}
                </button>
              </div>
            </>
          )}
        </ModalShell>
      )}
    </>
  )
}
