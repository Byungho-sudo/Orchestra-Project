"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  isProjectModuleTextGridSchemaMissingError,
  logSupabaseMutationResult,
} from "../helpers"

export type TextGridRowRecord = {
  id: string
  project_id: number
  module_id: string
  field1: string
  field2: string
  field3: string
  order: number
  created_at: string
  updated_at: string
}

export type TextGridRowDraft = {
  field1: string
  field2: string
  field3: string
}

export const emptyTextGridRowDraft: TextGridRowDraft = {
  field1: "",
  field2: "",
  field3: "",
}

function createTemporaryTextGridRowId() {
  return `temp-text-grid-row-${Date.now()}-${Math.random()}`
}

function normalizeTextGridRows(rows: TextGridRowRecord[]) {
  return [...rows]
    .sort((firstRow, secondRow) => {
      if (firstRow.order !== secondRow.order) {
        return firstRow.order - secondRow.order
      }

      return firstRow.created_at.localeCompare(secondRow.created_at)
    })
    .map((row, rowIndex) => ({
      ...row,
      order: rowIndex,
    }))
}

export function useProjectTextGrid({
  enabled,
  moduleId,
  projectId,
}: {
  enabled: boolean
  moduleId: string | null
  projectId: number
}) {
  const [rows, setRows] = useState<TextGridRowRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [schemaUnavailableMessage, setSchemaUnavailableMessage] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )

  const sortedRows = useMemo(() => normalizeTextGridRows(rows), [rows])

  const loadRows = useCallback(async () => {
    if (!enabled || !moduleId) {
      setRows([])
      setError("")
      setSchemaUnavailableMessage("")
      setSaveState("idle")
      return
    }

    setIsLoading(true)
    setError("")
    setSchemaUnavailableMessage("")

    const { data, error, status, statusText } = await supabase
      .from("project_module_text_grid_rows")
      .select("*")
      .eq("project_id", projectId)
      .eq("module_id", moduleId)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Project text grid fetch", {
      data,
      error,
      status,
      statusText,
    })

    setIsLoading(false)

    if (error) {
      if (isProjectModuleTextGridSchemaMissingError(error)) {
        setSchemaUnavailableMessage(
          "Text grid is unavailable until the project_module_text_grid_rows table is created."
        )
        setRows([])
        return
      }

      setError("Failed to load text grid rows. Please refresh and try again.")
      return
    }

    setRows(normalizeTextGridRows((data as TextGridRowRecord[]) || []))
  }, [enabled, moduleId, projectId])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  useEffect(() => {
    if (saveState !== "saved") return

    const saveStateTimeout = setTimeout(() => {
      setSaveState((currentState) =>
        currentState === "saved" ? "idle" : currentState
      )
    }, 1400)

    return () => {
      clearTimeout(saveStateTimeout)
    }
  }, [saveState])

  const createRow = useCallback(async () => {
    if (!enabled || !moduleId || isCreating) return false

    setError("")
    setIsCreating(true)
    setSaveState("saving")

    const temporaryId = createTemporaryTextGridRowId()
    const temporaryRow: TextGridRowRecord = {
      id: temporaryId,
      project_id: projectId,
      module_id: moduleId,
      field1: "",
      field2: "",
      field3: "",
      order: sortedRows.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setRows((currentRows) => [...currentRows, temporaryRow])

    const { data, error, status, statusText } = await supabase
      .from("project_module_text_grid_rows")
      .insert({
        project_id: projectId,
        module_id: moduleId,
        field1: "",
        field2: "",
        field3: "",
        order: sortedRows.length,
      })
      .select("*")
      .single()

    logSupabaseMutationResult("Project text grid insert", {
      data,
      error,
      status,
      statusText,
    })

    setIsCreating(false)

    if (error) {
      setRows((currentRows) =>
        currentRows.filter((row) => row.id !== temporaryId)
      )
      setError("Failed to create row. Please try again.")
      setSaveState("error")
      return false
    }

    setRows((currentRows) =>
      normalizeTextGridRows(
        currentRows.map((row) =>
          row.id === temporaryId ? (data as TextGridRowRecord) : row
        )
      )
    )
    setSaveState("saved")
    return true
  }, [enabled, isCreating, moduleId, projectId, sortedRows.length])

  const updateRow = useCallback(
    async (rowId: string, draft: TextGridRowDraft) => {
      if (!enabled || !moduleId || savingRowId) return false

      const previousRows = rows
      const optimisticRows = previousRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              field1: draft.field1,
              field2: draft.field2,
              field3: draft.field3,
            }
          : row
      )

      setError("")
      setSavingRowId(rowId)
      setSaveState("saving")
      setRows(optimisticRows)

      const { data, error, status, statusText } = await supabase
        .from("project_module_text_grid_rows")
        .update({
          field1: draft.field1,
          field2: draft.field2,
          field3: draft.field3,
        })
        .eq("id", rowId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)
        .select("*")
        .single()

      logSupabaseMutationResult("Project text grid update", {
        data,
        error,
        status,
        statusText,
      })

      setSavingRowId(null)

      if (error) {
        setRows(previousRows)
        setError("Failed to save row. Please try again.")
        setSaveState("error")
        return false
      }

      setRows((currentRows) =>
        currentRows.map((row) =>
          row.id === rowId ? (data as TextGridRowRecord) : row
        )
      )
      setSaveState("saved")
      return true
    },
    [enabled, moduleId, projectId, rows, savingRowId]
  )

  const deleteRow = useCallback(
    async (rowId: string) => {
      if (!enabled || !moduleId || savingRowId === rowId) return false

      const previousRows = rows
      const nextRows = previousRows.filter((row) => row.id !== rowId)

      setError("")
      setSavingRowId(rowId)
      setSaveState("saving")
      setRows(normalizeTextGridRows(nextRows))

      const { error, status, statusText } = await supabase
        .from("project_module_text_grid_rows")
        .delete()
        .eq("id", rowId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)

      logSupabaseMutationResult("Project text grid delete", {
        data: null,
        error,
        status,
        statusText,
      })

      setSavingRowId(null)

      if (error) {
        setRows(previousRows)
        setError("Failed to delete row. Please try again.")
        setSaveState("error")
        return false
      }

      setSaveState("saved")
      return true
    },
    [enabled, moduleId, projectId, rows, savingRowId]
  )

  return {
    createRow,
    deleteRow,
    error,
    isCreating,
    isLoading,
    rows: sortedRows,
    saveState,
    savingRowId,
    schemaUnavailableMessage,
    updateRow,
  }
}
