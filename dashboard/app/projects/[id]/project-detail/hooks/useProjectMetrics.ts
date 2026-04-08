"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  isProjectModuleMetricsSchemaMissingError,
  logSupabaseMutationResult,
} from "../helpers"

export type ProjectMetricRecord = {
  id: string
  project_id: number
  module_id: string
  name: string
  current_value: number
  target_value: number | null
  unit: string | null
  order: number
  created_at: string
  updated_at: string
}

export type ProjectMetricDraft = {
  name: string
  current_value: string
  target_value: string
  unit: string
}

export const emptyProjectMetricDraft: ProjectMetricDraft = {
  name: "",
  current_value: "",
  target_value: "",
  unit: "",
}

function createTemporaryProjectMetricId() {
  return `temp-project-metric-${Date.now()}-${Math.random()}`
}

function normalizeProjectMetrics(metrics: ProjectMetricRecord[]) {
  return [...metrics]
    .sort((firstMetric, secondMetric) => {
      if (firstMetric.order !== secondMetric.order) {
        return firstMetric.order - secondMetric.order
      }

      return firstMetric.created_at.localeCompare(secondMetric.created_at)
    })
    .map((metric, metricIndex) => ({
      ...metric,
      order: metricIndex,
    }))
}

function parseNumericInput(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) return null

  const parsedValue = Number(trimmedValue)

  if (!Number.isFinite(parsedValue)) {
    return null
  }

  return parsedValue
}

export function formatMetricValue(
  metric: Pick<ProjectMetricRecord, "current_value" | "target_value" | "unit">
) {
  const unitSuffix = metric.unit?.trim() ? ` ${metric.unit.trim()}` : ""

  if (metric.target_value === null) {
    return `${metric.current_value}${unitSuffix}`
  }

  return `${metric.current_value} / ${metric.target_value}${unitSuffix}`
}

export function getMetricProgress(
  metric: Pick<ProjectMetricRecord, "current_value" | "target_value">
) {
  if (metric.target_value === null || metric.target_value <= 0) {
    return null
  }

  return Math.min(
    100,
    Math.max(0, (metric.current_value / metric.target_value) * 100)
  )
}

export function getMetricCompletionState(
  metric: Pick<ProjectMetricRecord, "current_value" | "target_value">
) {
  if (metric.target_value === null || metric.target_value <= 0) {
    return "tracking" as const
  }

  if (metric.current_value >= metric.target_value) {
    return "complete" as const
  }

  return "in_progress" as const
}

export function summarizeProjectMetrics(metrics: ProjectMetricRecord[]) {
  const withTargets = metrics.filter(
    (metric) => metric.target_value !== null && metric.target_value > 0
  )
  const completed = withTargets.filter(
    (metric) => getMetricCompletionState(metric) === "complete"
  )
  const averageProgress =
    withTargets.length === 0
      ? null
      : withTargets.reduce(
          (totalProgress, metric) =>
            totalProgress + (getMetricProgress(metric) ?? 0),
          0
        ) / withTargets.length

  return {
    averageProgress,
    completedCount: completed.length,
    totalCount: metrics.length,
    withTargetCount: withTargets.length,
  }
}

export function useProjectMetrics({
  enabled,
  moduleId,
  projectId,
}: {
  enabled: boolean
  moduleId: string | null
  projectId: number
}) {
  const [metrics, setMetrics] = useState<ProjectMetricRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [savingMetricId, setSavingMetricId] = useState<string | null>(null)
  const [movingMetricId, setMovingMetricId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [schemaUnavailableMessage, setSchemaUnavailableMessage] = useState("")

  const sortedMetrics = useMemo(() => normalizeProjectMetrics(metrics), [metrics])

  const loadMetrics = useCallback(async () => {
    if (!enabled || !moduleId) {
      setMetrics([])
      setError("")
      setSchemaUnavailableMessage("")
      return
    }

    setIsLoading(true)
    setError("")
    setSchemaUnavailableMessage("")

    const { data, error, status, statusText } = await supabase
      .from("project_module_metrics")
      .select("*")
      .eq("project_id", projectId)
      .eq("module_id", moduleId)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Project metrics fetch", {
      data,
      error,
      status,
      statusText,
    })

    setIsLoading(false)

    if (error) {
      if (isProjectModuleMetricsSchemaMissingError(error)) {
        setSchemaUnavailableMessage(
          "Metrics are unavailable until the project_module_metrics table is created."
        )
        setMetrics([])
        return
      }

      setError("Failed to load metrics. Please refresh and try again.")
      return
    }

    setMetrics(normalizeProjectMetrics((data as ProjectMetricRecord[]) || []))
  }, [enabled, moduleId, projectId])

  useEffect(() => {
    void loadMetrics()
  }, [loadMetrics])

  const validateDraft = useCallback((draft: ProjectMetricDraft) => {
    if (!draft.name.trim()) return "Metric name is required."

    const currentValue = parseNumericInput(draft.current_value)

    if (currentValue === null) {
      return "Current value must be a valid number."
    }

    const hasTargetValue = draft.target_value.trim().length > 0

    if (hasTargetValue) {
      const targetValue = parseNumericInput(draft.target_value)

      if (targetValue === null) {
        return "Target value must be a valid number."
      }

      if (targetValue <= 0) {
        return "Target value must be greater than zero."
      }
    }

    return ""
  }, [])

  const createMetric = useCallback(
    async (draft: ProjectMetricDraft) => {
      if (!enabled || !moduleId || isCreating) return false

      const validationError = validateDraft(draft)

      if (validationError) {
        setError(validationError)
        return false
      }

      const currentValue = parseNumericInput(draft.current_value)
      const targetValue = parseNumericInput(draft.target_value)

      if (currentValue === null) {
        setError("Current value must be a valid number.")
        return false
      }

      setError("")
      setIsCreating(true)

      const temporaryId = createTemporaryProjectMetricId()
      const temporaryMetric: ProjectMetricRecord = {
        id: temporaryId,
        project_id: projectId,
        module_id: moduleId,
        name: draft.name.trim(),
        current_value: currentValue,
        target_value: targetValue,
        unit: draft.unit.trim() || null,
        order: sortedMetrics.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setMetrics((currentMetrics) => [...currentMetrics, temporaryMetric])

      const { data, error, status, statusText } = await supabase
        .from("project_module_metrics")
        .insert({
          project_id: projectId,
          module_id: moduleId,
          name: draft.name.trim(),
          current_value: currentValue,
          target_value: targetValue,
          unit: draft.unit.trim() || null,
          order: sortedMetrics.length,
        })
        .select("*")
        .single()

      logSupabaseMutationResult("Project metric insert", {
        data,
        error,
        status,
        statusText,
      })

      setIsCreating(false)

      if (error) {
        setMetrics((currentMetrics) =>
          currentMetrics.filter((metric) => metric.id !== temporaryId)
        )
        setError("Failed to create metric. Please try again.")
        return false
      }

      setMetrics((currentMetrics) =>
        normalizeProjectMetrics(
          currentMetrics.map((metric) =>
            metric.id === temporaryId ? (data as ProjectMetricRecord) : metric
          )
        )
      )

      return true
    },
    [enabled, isCreating, moduleId, projectId, sortedMetrics.length, validateDraft]
  )

  const updateMetric = useCallback(
    async (metricId: string, draft: ProjectMetricDraft) => {
      if (!enabled || !moduleId || savingMetricId) return false

      const validationError = validateDraft(draft)

      if (validationError) {
        setError(validationError)
        return false
      }

      const currentValue = parseNumericInput(draft.current_value)
      const targetValue = parseNumericInput(draft.target_value)

      if (currentValue === null) {
        setError("Current value must be a valid number.")
        return false
      }

      const previousMetrics = metrics
      const optimisticMetrics = previousMetrics.map((metric) =>
        metric.id === metricId
          ? {
              ...metric,
              name: draft.name.trim(),
              current_value: currentValue,
              target_value: targetValue,
              unit: draft.unit.trim() || null,
            }
          : metric
      )

      setError("")
      setSavingMetricId(metricId)
      setMetrics(optimisticMetrics)

      const { data, error, status, statusText } = await supabase
        .from("project_module_metrics")
        .update({
          name: draft.name.trim(),
          current_value: currentValue,
          target_value: targetValue,
          unit: draft.unit.trim() || null,
        })
        .eq("id", metricId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)
        .select("*")
        .single()

      logSupabaseMutationResult("Project metric update", {
        data,
        error,
        status,
        statusText,
      })

      setSavingMetricId(null)

      if (error) {
        setMetrics(previousMetrics)
        setError("Failed to update metric. Please try again.")
        return false
      }

      setMetrics((currentMetrics) =>
        normalizeProjectMetrics(
          currentMetrics.map((metric) =>
            metric.id === metricId ? (data as ProjectMetricRecord) : metric
          )
        )
      )

      return true
    },
    [enabled, metrics, moduleId, projectId, savingMetricId, validateDraft]
  )

  const reorderMetrics = useCallback(
    async (nextMetrics: ProjectMetricRecord[], activeMetricId: string | null) => {
      if (!enabled || !moduleId) return false

      const previousMetrics = metrics
      const normalizedMetrics = normalizeProjectMetrics(nextMetrics)

      setError("")
      setMovingMetricId(activeMetricId)
      setMetrics(normalizedMetrics)

      const { error, status, statusText } = await supabase
        .from("project_module_metrics")
        .upsert(
          normalizedMetrics.map((metric, metricIndex) => ({
            id: metric.id,
            project_id: projectId,
            module_id: moduleId,
            name: metric.name,
            current_value: metric.current_value,
            target_value: metric.target_value,
            unit: metric.unit,
            order: metricIndex,
          })),
          { onConflict: "id" }
        )

      logSupabaseMutationResult("Project metrics reorder", {
        data: null,
        error,
        status,
        statusText,
      })

      setMovingMetricId(null)

      if (error) {
        setMetrics(previousMetrics)
        setError("Failed to reorder metrics. Please try again.")
        return false
      }

      return true
    },
    [enabled, metrics, moduleId, projectId]
  )

  const moveMetric = useCallback(
    async (metricId: string, direction: "up" | "down") => {
      const currentIndex = sortedMetrics.findIndex(
        (metric) => metric.id === metricId
      )

      if (currentIndex === -1) return false

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1

      if (targetIndex < 0 || targetIndex >= sortedMetrics.length) {
        return false
      }

      const reorderedMetrics = [...sortedMetrics]
      const [movedMetric] = reorderedMetrics.splice(currentIndex, 1)
      reorderedMetrics.splice(targetIndex, 0, movedMetric)

      return reorderMetrics(reorderedMetrics, metricId)
    },
    [reorderMetrics, sortedMetrics]
  )

  const deleteMetric = useCallback(
    async (metricId: string) => {
      if (!enabled || !moduleId || savingMetricId === metricId) return false

      const previousMetrics = metrics
      const nextMetrics = previousMetrics.filter((metric) => metric.id !== metricId)

      setError("")
      setSavingMetricId(metricId)
      setMetrics(normalizeProjectMetrics(nextMetrics))

      const { error, status, statusText } = await supabase
        .from("project_module_metrics")
        .delete()
        .eq("id", metricId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)

      logSupabaseMutationResult("Project metric delete", {
        data: null,
        error,
        status,
        statusText,
      })

      setSavingMetricId(null)

      if (error) {
        setMetrics(previousMetrics)
        setError("Failed to delete metric. Please try again.")
        return false
      }

      if (nextMetrics.length > 0) {
        await reorderMetrics(nextMetrics, null)
      }

      return true
    },
    [enabled, metrics, moduleId, projectId, reorderMetrics, savingMetricId]
  )

  return {
    createMetric,
    deleteMetric,
    error,
    isCreating,
    isLoading,
    metrics: sortedMetrics,
    moveMetric,
    movingMetricId,
    savingMetricId,
    schemaUnavailableMessage,
    summary: summarizeProjectMetrics(sortedMetrics),
    updateMetric,
  }
}
