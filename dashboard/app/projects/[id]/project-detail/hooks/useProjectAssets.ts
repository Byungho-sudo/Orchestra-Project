"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  isProjectAssetsSchemaMissingError,
  logSupabaseMutationResult,
} from "../helpers"

export type ProjectAssetCategory =
  | "document"
  | "link"
  | "file"
  | "image"
  | "other"

export type ProjectAssetRecord = {
  id: string
  project_id: number
  module_id: string
  name: string
  url: string | null
  description: string | null
  category: ProjectAssetCategory
  order: number
  created_at: string
  updated_at: string
}

export type ProjectAssetDraft = {
  name: string
  url: string
  description: string
  category: ProjectAssetCategory
}

export const emptyProjectAssetDraft: ProjectAssetDraft = {
  name: "",
  url: "",
  description: "",
  category: "other",
}

function createTemporaryProjectAssetId() {
  return `temp-project-asset-${Date.now()}-${Math.random()}`
}

function normalizeProjectAssets(assets: ProjectAssetRecord[]) {
  return [...assets]
    .sort((firstAsset, secondAsset) => {
      if (firstAsset.order !== secondAsset.order) {
        return firstAsset.order - secondAsset.order
      }

      return firstAsset.created_at.localeCompare(secondAsset.created_at)
    })
    .map((asset, assetIndex) => ({
      ...asset,
      order: assetIndex,
    }))
}

export function useProjectAssets({
  enabled,
  moduleId,
  projectId,
}: {
  enabled: boolean
  moduleId: string | null
  projectId: number
}) {
  const [assets, setAssets] = useState<ProjectAssetRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [savingAssetId, setSavingAssetId] = useState<string | null>(null)
  const [movingAssetId, setMovingAssetId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [schemaUnavailableMessage, setSchemaUnavailableMessage] = useState("")

  const sortedAssets = useMemo(() => normalizeProjectAssets(assets), [assets])

  const loadAssets = useCallback(async () => {
    if (!enabled || !moduleId) {
      setAssets([])
      setError("")
      setSchemaUnavailableMessage("")
      return
    }

    setIsLoading(true)
    setError("")
    setSchemaUnavailableMessage("")

    const { data, error, status, statusText } = await supabase
      .from("project_assets")
      .select("*")
      .eq("project_id", projectId)
      .eq("module_id", moduleId)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Project assets fetch", {
      data,
      error,
      status,
      statusText,
    })

    setIsLoading(false)

    if (error) {
      if (isProjectAssetsSchemaMissingError(error)) {
        setSchemaUnavailableMessage(
          "Assets are unavailable until the project_assets table is created."
        )
        setAssets([])
        return
      }

      setError("Failed to load assets. Please refresh and try again.")
      return
    }

    setAssets(normalizeProjectAssets((data as ProjectAssetRecord[]) || []))
  }, [enabled, moduleId, projectId])

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  const validateDraft = useCallback((draft: ProjectAssetDraft) => {
    if (!draft.name.trim()) return "Asset name is required."
    if (!draft.category.trim()) return "Asset category is required."
    return ""
  }, [])

  const createAsset = useCallback(
    async (draft: ProjectAssetDraft) => {
      if (!enabled || !moduleId || isCreating) return false

      const validationError = validateDraft(draft)

      if (validationError) {
        setError(validationError)
        return false
      }

      setError("")
      setIsCreating(true)

      const temporaryId = createTemporaryProjectAssetId()
      const temporaryAsset: ProjectAssetRecord = {
        id: temporaryId,
        project_id: projectId,
        module_id: moduleId,
        name: draft.name.trim(),
        url: draft.url.trim() || null,
        description: draft.description.trim() || null,
        category: draft.category,
        order: sortedAssets.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setAssets((currentAssets) => [...currentAssets, temporaryAsset])

      const { data, error, status, statusText } = await supabase
        .from("project_assets")
        .insert({
          project_id: projectId,
          module_id: moduleId,
          name: draft.name.trim(),
          url: draft.url.trim() || null,
          description: draft.description.trim() || null,
          category: draft.category,
          order: sortedAssets.length,
        })
        .select("*")
        .single()

      logSupabaseMutationResult("Project asset insert", {
        data,
        error,
        status,
        statusText,
      })

      setIsCreating(false)

      if (error) {
        setAssets((currentAssets) =>
          currentAssets.filter((asset) => asset.id !== temporaryId)
        )
        setError("Failed to create asset. Please try again.")
        return false
      }

      setAssets((currentAssets) =>
        normalizeProjectAssets(
          currentAssets.map((asset) =>
            asset.id === temporaryId ? (data as ProjectAssetRecord) : asset
          )
        )
      )

      return true
    },
    [enabled, isCreating, moduleId, projectId, sortedAssets.length, validateDraft]
  )

  const updateAsset = useCallback(
    async (assetId: string, draft: ProjectAssetDraft) => {
      if (!enabled || !moduleId || savingAssetId) return false

      const validationError = validateDraft(draft)

      if (validationError) {
        setError(validationError)
        return false
      }

      const previousAssets = assets
      const optimisticAssets = previousAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              name: draft.name.trim(),
              url: draft.url.trim() || null,
              description: draft.description.trim() || null,
              category: draft.category,
            }
          : asset
      )

      setError("")
      setSavingAssetId(assetId)
      setAssets(optimisticAssets)

      const { data, error, status, statusText } = await supabase
        .from("project_assets")
        .update({
          name: draft.name.trim(),
          url: draft.url.trim() || null,
          description: draft.description.trim() || null,
          category: draft.category,
        })
        .eq("id", assetId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)
        .select("*")
        .single()

      logSupabaseMutationResult("Project asset update", {
        data,
        error,
        status,
        statusText,
      })

      setSavingAssetId(null)

      if (error) {
        setAssets(previousAssets)
        setError("Failed to update asset. Please try again.")
        return false
      }

      setAssets((currentAssets) =>
        normalizeProjectAssets(
          currentAssets.map((asset) =>
            asset.id === assetId ? (data as ProjectAssetRecord) : asset
          )
        )
      )

      return true
    },
    [assets, enabled, moduleId, projectId, savingAssetId, validateDraft]
  )

  const reorderAssets = useCallback(
    async (nextAssets: ProjectAssetRecord[], activeAssetId: string | null) => {
      if (!enabled || !moduleId) return false

      const previousAssets = assets
      const normalizedAssets = normalizeProjectAssets(nextAssets)

      setError("")
      setMovingAssetId(activeAssetId)
      setAssets(normalizedAssets)

      const { error, status, statusText } = await supabase
        .from("project_assets")
        .upsert(
          normalizedAssets.map((asset, assetIndex) => ({
            id: asset.id,
            project_id: projectId,
            module_id: moduleId,
            name: asset.name,
            url: asset.url,
            description: asset.description,
            category: asset.category,
            order: assetIndex,
          })),
          { onConflict: "id" }
        )

      logSupabaseMutationResult("Project assets reorder", {
        data: null,
        error,
        status,
        statusText,
      })

      setMovingAssetId(null)

      if (error) {
        setAssets(previousAssets)
        setError("Failed to reorder assets. Please try again.")
        return false
      }

      return true
    },
    [assets, enabled, moduleId, projectId]
  )

  const moveAsset = useCallback(
    async (assetId: string, direction: "up" | "down") => {
      const currentIndex = sortedAssets.findIndex((asset) => asset.id === assetId)

      if (currentIndex === -1) return false

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1

      if (targetIndex < 0 || targetIndex >= sortedAssets.length) {
        return false
      }

      const reorderedAssets = [...sortedAssets]
      const [movedAsset] = reorderedAssets.splice(currentIndex, 1)
      reorderedAssets.splice(targetIndex, 0, movedAsset)

      return reorderAssets(reorderedAssets, assetId)
    },
    [reorderAssets, sortedAssets]
  )

  const deleteAsset = useCallback(
    async (assetId: string) => {
      if (!enabled || !moduleId || savingAssetId === assetId) return false

      const previousAssets = assets
      const nextAssets = previousAssets.filter((asset) => asset.id !== assetId)

      setError("")
      setSavingAssetId(assetId)
      setAssets(normalizeProjectAssets(nextAssets))

      const { error, status, statusText } = await supabase
        .from("project_assets")
        .delete()
        .eq("id", assetId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)

      logSupabaseMutationResult("Project asset delete", {
        data: null,
        error,
        status,
        statusText,
      })

      setSavingAssetId(null)

      if (error) {
        setAssets(previousAssets)
        setError("Failed to delete asset. Please try again.")
        return false
      }

      if (nextAssets.length > 0) {
        await reorderAssets(nextAssets, null)
      }

      return true
    },
    [assets, enabled, moduleId, projectId, reorderAssets, savingAssetId]
  )

  return {
    assets: sortedAssets,
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
  }
}
