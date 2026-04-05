"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ProjectMetadata } from "@/lib/projects"
import { supabase } from "@/lib/supabase"
import {
  createMetadataDraft,
  createMetadataDrafts,
  isProjectMetadataSchemaMissingError,
  logSupabaseMutationResult,
  mapProjectMetadata,
  normalizeMetadataDrafts,
} from "../helpers"
import type { ProjectMetadataDraft } from "../types"

export function useProjectMetadata({ projectId }: { projectId: number }) {
  const router = useRouter()
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata[]>([])
  const [metadataForm, setMetadataForm] = useState<ProjectMetadataDraft[]>([])
  const [metadataError, setMetadataError] = useState("")
  const [isSavingMetadata, setIsSavingMetadata] = useState(false)

  const loadProjectMetadata = useCallback(async () => {
    const { data, error, status, statusText } = await supabase
      .from("project_metadata")
      .select("id,project_id,key,value,order,created_at")
      .eq("project_id", projectId)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Project metadata fetch", {
      data,
      error,
      status,
      statusText,
    })

    if (error) {
      if (isProjectMetadataSchemaMissingError(error)) {
        console.warn(
          "Project metadata table is unavailable. Rendering without optional metadata.",
          error
        )
        setProjectMetadata([])
        return
      }

      console.error("Project metadata fetch failed:", error)
      setProjectMetadata([])
      return
    }

    setProjectMetadata(mapProjectMetadata((data as ProjectMetadata[]) || []))
  }, [projectId])

  useEffect(() => {
    void loadProjectMetadata()
  }, [loadProjectMetadata])

  const beginEditingMetadata = useCallback(() => {
    setMetadataForm(createMetadataDrafts(projectMetadata))
    setMetadataError("")
  }, [projectMetadata])

  const clearMetadataError = useCallback(() => {
    setMetadataError("")
  }, [])

  const addMetadataField = useCallback(() => {
    setMetadataForm((current) => [
      ...current,
      createMetadataDraft({ order: current.length + 1 }),
    ])
  }, [])

  const updateMetadataField = useCallback(
    (metadataId: string, field: "key" | "value", value: string) => {
      setMetadataForm((current) =>
        current.map((metadata) =>
          metadata.id === metadataId ? { ...metadata, [field]: value } : metadata
        )
      )

      if (metadataError) {
        setMetadataError("")
      }
    },
    [metadataError]
  )

  const deleteMetadataField = useCallback(
    (metadataId: string) => {
      setMetadataForm((current) =>
        current
          .filter((metadata) => metadata.id !== metadataId)
          .map((metadata, metadataIndex) => ({
            ...metadata,
            order: metadataIndex + 1,
          }))
      )

      if (metadataError) {
        setMetadataError("")
      }
    },
    [metadataError]
  )

  const saveMetadata = useCallback(async () => {
    if (isSavingMetadata) return false

    const normalizedMetadata = normalizeMetadataDrafts(metadataForm)
    const hasIncompleteMetadataField = normalizedMetadata.some(
      (metadata) => !metadata.key || !metadata.value
    )

    if (hasIncompleteMetadataField) {
      setMetadataError("Each custom field needs both a label and a value.")
      return false
    }

    setMetadataError("")
    setIsSavingMetadata(true)

    try {
      await supabase
        .from("project_metadata")
        .delete()
        .eq("project_id", projectId)

      if (normalizedMetadata.length > 0) {
        const { data, error, status, statusText } = await supabase
          .from("project_metadata")
          .insert(
            normalizedMetadata.map((metadata, metadataIndex) => ({
              project_id: projectId,
              key: metadata.key,
              value: metadata.value,
              order: metadataIndex + 1,
            }))
          )
          .select("id,project_id,key,value,order,created_at")

        logSupabaseMutationResult("Project metadata save", {
          data,
          error,
          status,
          statusText,
        })

        if (error) {
          throw error
        }
      }

      await loadProjectMetadata()
      router.refresh()
      return true
    } catch (error) {
      console.error("Project metadata save failed:", error)
      console.error(
        "Project metadata save failed JSON:",
        JSON.stringify(error, null, 2)
      )
      setMetadataError("Failed to save metadata. Please try again.")
      return false
    } finally {
      setIsSavingMetadata(false)
    }
  }, [isSavingMetadata, loadProjectMetadata, metadataForm, projectId, router])

  const sortedProjectMetadata = mapProjectMetadata(projectMetadata)

  return {
    addMetadataField,
    beginEditingMetadata,
    clearMetadataError,
    deleteMetadataField,
    isSavingMetadata,
    metadataError,
    metadataForm,
    saveMetadata,
    sortedProjectMetadata,
    updateMetadataField,
  }
}
