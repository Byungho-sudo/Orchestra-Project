"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { isProjectModuleInstanceId } from "./helpers"
import {
  emptyTextGridRowDraft,
  useProjectTextGrid,
  type TextGridRowDraft,
  type TextGridRowRecord,
} from "./hooks/useProjectTextGrid"

function getSaveStateLabel(saveState: "idle" | "saving" | "saved" | "error") {
  if (saveState === "saving") return "Saving..."
  if (saveState === "saved") return "Saved"
  if (saveState === "error") return "Error"
  return "Autosave on"
}

function getSaveStateClassName(saveState: "idle" | "saving" | "saved" | "error") {
  if (saveState === "saving") return "text-slate-500"
  if (saveState === "saved") return "text-emerald-600"
  if (saveState === "error") return "text-red-600"
  return "text-slate-500"
}

function createRowDraft(row: TextGridRowRecord): TextGridRowDraft {
  return {
    field1: row.field1,
    field2: row.field2,
    field3: row.field3,
  }
}

function areRowDraftsEqual(
  firstDraft: TextGridRowDraft,
  secondDraft: TextGridRowDraft
) {
  return (
    firstDraft.field1 === secondDraft.field1 &&
    firstDraft.field2 === secondDraft.field2 &&
    firstDraft.field3 === secondDraft.field3
  )
}

const autosaveDelayMs = 700

export function TextGridModule({
  moduleId,
  projectId,
}: {
  moduleId: string
  projectId: number
}) {
  const persistedModuleId = isProjectModuleInstanceId(moduleId)
  const {
    createRow,
    deleteRow,
    error,
    isCreating,
    isLoading,
    rows,
    saveState,
    savingRowId,
    schemaUnavailableMessage,
    updateRow,
  } = useProjectTextGrid({
    enabled: persistedModuleId,
    moduleId: persistedModuleId ? moduleId : null,
    projectId,
  })
  const [rowDrafts, setRowDrafts] = useState<Record<string, TextGridRowDraft>>({})
  const autosaveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  )

  const saveableRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          !areRowDraftsEqual(rowDrafts[row.id] ?? createRowDraft(row), createRowDraft(row))
      ),
    [rowDrafts, rows]
  )

  useEffect(() => {
    setRowDrafts((currentDrafts) => {
      const nextDrafts: Record<string, TextGridRowDraft> = {}

      for (const row of rows) {
        nextDrafts[row.id] = currentDrafts[row.id] ?? createRowDraft(row)
      }

      return nextDrafts
    })
  }, [rows])

  useEffect(() => {
    const autosaveTimeouts = autosaveTimeoutsRef.current

    return () => {
      Object.values(autosaveTimeouts).forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
    }
  }, [])

  const handleDraftChange = useCallback(
    (rowId: string, field: keyof TextGridRowDraft, value: string) => {
      if (savingRowId === rowId) return

      setRowDrafts((currentDrafts) => {
        const nextDraft = {
          ...(currentDrafts[rowId] ?? emptyTextGridRowDraft),
          [field]: value,
        }

        if (autosaveTimeoutsRef.current[rowId]) {
          clearTimeout(autosaveTimeoutsRef.current[rowId])
        }

        autosaveTimeoutsRef.current[rowId] = setTimeout(() => {
          delete autosaveTimeoutsRef.current[rowId]
          void updateRow(rowId, nextDraft)
        }, autosaveDelayMs)

        return {
          ...currentDrafts,
          [rowId]: nextDraft,
        }
      })
    },
    [savingRowId, updateRow]
  )

  const handleDeleteRow = useCallback(
    async (rowId: string) => {
      if (autosaveTimeoutsRef.current[rowId]) {
        clearTimeout(autosaveTimeoutsRef.current[rowId])
        delete autosaveTimeoutsRef.current[rowId]
      }

      const didDelete = await deleteRow(rowId)

      if (!didDelete) return

      setRowDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts }
        delete nextDrafts[rowId]
        return nextDrafts
      })
    },
    [deleteRow]
  )

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Text Grid
        </p>

        <p
          className={`text-xs font-semibold uppercase tracking-[0.2em] ${getSaveStateClassName(
            saveState
          )}`}
        >
          {getSaveStateLabel(saveState)}
        </p>
      </div>

      {!persistedModuleId && (
        <p className="mt-4 text-sm text-slate-500">
          Text grid is still syncing to the saved workspace module.
        </p>
      )}

      {schemaUnavailableMessage && (
        <p className="mt-4 text-sm font-medium text-amber-700">
          {schemaUnavailableMessage}
        </p>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Track structured rows without manually saving each edit.
          </p>

          <button
            type="button"
            onClick={() => void createRow()}
            disabled={!persistedModuleId || isCreating || Boolean(schemaUnavailableMessage)}
            className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Adding..." : "Add Row"}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <span>Field 1</span>
            <span>Field 2</span>
            <span>Field 3</span>
            <span className="text-right">Delete</span>
          </div>

          {isLoading ? (
            <p className="px-4 py-5 text-sm text-slate-500">Loading rows...</p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-5 text-sm text-slate-400">
              No rows added yet. Add a row to start organizing structured notes.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {rows.map((row) => {
                const draft = rowDrafts[row.id] ?? createRowDraft(row)
                const isRowSaving = savingRowId === row.id

                return (
                  <div
                    key={row.id}
                    className="grid gap-3 px-4 py-4 transition-colors duration-200 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <input
                      type="text"
                      value={draft.field1}
                      onChange={(event) =>
                        handleDraftChange(row.id, "field1", event.target.value)
                      }
                      disabled={isRowSaving}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <input
                      type="text"
                      value={draft.field2}
                      onChange={(event) =>
                        handleDraftChange(row.id, "field2", event.target.value)
                      }
                      disabled={isRowSaving}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <input
                      type="text"
                      value={draft.field3}
                      onChange={(event) =>
                        handleDraftChange(row.id, "field3", event.target.value)
                      }
                      disabled={isRowSaving}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <span className="text-xs font-medium text-slate-400">
                        {isRowSaving ? "Saving..." : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRow(row.id)}
                        disabled={isRowSaving}
                        className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {saveableRows.length > 0 && saveState === "idle" && (
          <p className="text-xs font-medium text-slate-500">
            Changes save automatically after you stop typing.
          </p>
        )}
      </div>
    </>
  )
}
