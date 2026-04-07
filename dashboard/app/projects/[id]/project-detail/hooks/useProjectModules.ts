"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getDefaultProjectModuleRows,
  getDefaultProjectWorkspaceModules,
} from "@/lib/project-modules"
import { supabase } from "@/lib/supabase"
import {
  isProjectModulesSchemaMissingError,
  logSupabaseMutationResult,
  mapWorkspaceModules,
  normalizeWorkspaceModuleOrder,
} from "../helpers"
import type {
  CreateProjectModuleForm,
  ProjectModuleRecord,
  ProjectWorkspaceModule,
} from "../types"

const emptyModuleForm: CreateProjectModuleForm = {
  title: "",
  type: "notes",
}

export function useProjectModules({ projectId }: { projectId: number }) {
  const [workspaceModules, setWorkspaceModules] =
    useState<ProjectWorkspaceModule[]>(getDefaultProjectWorkspaceModules())
  const [createModuleForm, setCreateModuleForm] =
    useState<CreateProjectModuleForm>(emptyModuleForm)
  const [editModuleForm, setEditModuleForm] =
    useState<CreateProjectModuleForm>(emptyModuleForm)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [isUpdatingModule, setIsUpdatingModule] = useState(false)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)
  const [movingModuleId, setMovingModuleId] = useState<string | null>(null)
  const [isResettingModules, setIsResettingModules] = useState(false)
  const [moduleError, setModuleError] = useState("")

  const sortedWorkspaceModules = useMemo(
    () =>
      [...workspaceModules].sort(
        (firstModule, secondModule) => firstModule.order - secondModule.order
      ),
    [workspaceModules]
  )
  const editingModule = useMemo(
    () =>
      editingModuleId
        ? workspaceModules.find((module) => module.id === editingModuleId) ?? null
        : null,
    [editingModuleId, workspaceModules]
  )
  const hasCreateModuleChanges =
    createModuleForm.title.trim() !== "" || createModuleForm.type !== "notes"
  const hasEditModuleChanges = editingModule
    ? editModuleForm.title.trim() !== editingModule.title.trim() ||
      editModuleForm.type !== editingModule.type
    : false

  const loadWorkspaceModules = useCallback(async () => {
    const { data, error, status, statusText } = await supabase
      .from("project_modules")
      .select("id,title,type,order")
      .eq("project_id", projectId)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Project modules fetch", {
      data,
      error,
      status,
      statusText,
    })

    if (error) {
      if (isProjectModulesSchemaMissingError(error)) {
        console.warn(
          "Project modules table is unavailable. Rendering default workspace modules only.",
          error
        )
        setWorkspaceModules(getDefaultProjectWorkspaceModules())
        return
      }

      console.error("Project modules fetch failed:", error)
      setWorkspaceModules(getDefaultProjectWorkspaceModules())
      return
    }

    const moduleRows = (data as ProjectModuleRecord[]) || []

    if (moduleRows.length > 0) {
      const normalizedModules = mapWorkspaceModules(moduleRows)

      if (
        moduleRows.some((moduleRow, moduleIndex) => moduleRow.order !== moduleIndex)
      ) {
        const { error: normalizeError } = await supabase
          .from("project_modules")
          .upsert(
            normalizedModules.map((module) => ({
              id: module.id,
              project_id: projectId,
              title: module.title,
              type: module.type,
              order: module.order,
            })),
            { onConflict: "id" }
          )

        if (normalizeError) {
          console.warn(
            "Failed to normalize project module ordering. Rendering normalized order locally.",
            normalizeError
          )
        }
      }

      setWorkspaceModules(normalizedModules)
      return
    }

    const {
      data: defaultModulesData,
      error: defaultModulesError,
      status: defaultModulesStatus,
      statusText: defaultModulesStatusText,
    } = await supabase
      .from("project_modules")
      .insert(getDefaultProjectModuleRows(projectId))
      .select("id,title,type,order")
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Default project modules insert", {
      data: defaultModulesData,
      error: defaultModulesError,
      status: defaultModulesStatus,
      statusText: defaultModulesStatusText,
    })

    if (defaultModulesError) {
      console.warn(
        "Failed to seed default project modules. Rendering local defaults only.",
        defaultModulesError
      )
      setWorkspaceModules(getDefaultProjectWorkspaceModules())
      return
    }

    const normalizedDefaultModules = mapWorkspaceModules(
      (defaultModulesData as ProjectModuleRecord[]) || []
    )

    setWorkspaceModules(normalizedDefaultModules)

    const { error: normalizeDefaultModulesError } = await supabase
      .from("project_modules")
      .upsert(
        normalizedDefaultModules.map((module) => ({
          id: module.id,
          project_id: projectId,
          title: module.title,
          type: module.type,
          order: module.order,
        })),
        { onConflict: "id" }
      )

    if (normalizeDefaultModulesError) {
      console.warn(
        "Default project modules were created, but 0-based order normalization failed.",
        normalizeDefaultModulesError
      )
    }
  }, [projectId])

  useEffect(() => {
    void loadWorkspaceModules()
  }, [loadWorkspaceModules])

  function clearModuleError() {
    setModuleError("")
  }

  function prepareCreateModule() {
    setModuleError("")
    setCreateModuleForm(emptyModuleForm)
  }

  function prepareEditModule(module: ProjectWorkspaceModule) {
    setModuleError("")
    setEditingModuleId(module.id)
    setEditModuleForm({
      title: module.title,
      type: module.type,
    })
  }

  function resetEditModuleDraft() {
    setEditingModuleId(null)
    setModuleError("")
    setEditModuleForm(emptyModuleForm)
  }

  async function persistWorkspaceModuleOrder(
    nextModules: ProjectWorkspaceModule[],
    activeModuleId: string | null,
    options?: {
      errorMessage?: string
      restoreOnFailure?: boolean
      useTemporaryOrders?: boolean
    }
  ) {
    const normalizedModules = normalizeWorkspaceModuleOrder(nextModules)
    const previousModules = workspaceModules
    const errorMessage =
      options?.errorMessage ?? "Failed to reorder module. Please try again."
    const restoreOnFailure = options?.restoreOnFailure ?? true
    const useTemporaryOrders = options?.useTemporaryOrders ?? true

    setModuleError("")
    setMovingModuleId(activeModuleId)
    setWorkspaceModules(normalizedModules)

    if (useTemporaryOrders && normalizedModules.length > 0) {
      const { error: reserveTemporaryOrdersError } = await supabase
        .from("project_modules")
        .upsert(
          normalizedModules.map((module, moduleIndex) => ({
            id: module.id,
            project_id: projectId,
            title: module.title,
            type: module.type,
            order: -1 * (moduleIndex + 1),
          })),
          { onConflict: "id" }
        )

      if (reserveTemporaryOrdersError) {
        console.error(
          "Project module reorder failed while reserving temporary orders:",
          reserveTemporaryOrdersError
        )
        if (restoreOnFailure) {
          setWorkspaceModules(previousModules)
        }
        setMovingModuleId(null)
        setModuleError(errorMessage)
        await loadWorkspaceModules()
        return false
      }
    }

    const { error: finalizeOrderError } = await supabase
      .from("project_modules")
      .upsert(
        normalizedModules.map((module) => ({
          id: module.id,
          project_id: projectId,
          title: module.title,
          type: module.type,
          order: module.order,
        })),
        { onConflict: "id" }
      )

    setMovingModuleId(null)

    if (finalizeOrderError) {
      console.error(
        "Project module reorder failed while finalizing orders:",
        finalizeOrderError
      )
      if (restoreOnFailure) {
        setWorkspaceModules(previousModules)
      }
      setModuleError(errorMessage)
      await loadWorkspaceModules()
      return false
    }

    return true
  }

  async function createModule() {
    if (isCreatingModule || isResettingModules || deletingModuleId || movingModuleId) {
      return false
    }

    const moduleTitle = createModuleForm.title.trim()

    if (!moduleTitle) {
      setModuleError("Module title is required.")
      return false
    }

    setModuleError("")
    setIsCreatingModule(true)

    const normalizedExistingModules = normalizeWorkspaceModuleOrder(
      workspaceModules
    )
    const nextOrder = normalizedExistingModules.length

    const { data, error, status, statusText } = await supabase
      .from("project_modules")
      .insert({
        project_id: projectId,
        title: moduleTitle,
        type: createModuleForm.type,
        order: nextOrder,
      })
      .select("id,title,type,order")
      .single()

    logSupabaseMutationResult("Project module insert", {
      data,
      error,
      status,
      statusText,
    })

    setIsCreatingModule(false)

    if (error) {
      if (isProjectModulesSchemaMissingError(error)) {
        console.warn(
          "Project modules table is unavailable. Custom modules cannot be saved until the migration is applied.",
          error
        )
        setModuleError(
          "Custom modules are unavailable until the project_modules table is created."
        )
        setWorkspaceModules(getDefaultProjectWorkspaceModules())
        return false
      }

      setModuleError("Failed to create module. Please try again.")
      return false
    }

    const createdModule = data as ProjectModuleRecord
    const normalizedCreatedModule = mapWorkspaceModules([createdModule])[0]

    if (!normalizedCreatedModule) {
      setModuleError("Failed to normalize the new module.")
      return false
    }

    const nextModules = normalizeWorkspaceModuleOrder([
      ...normalizedExistingModules,
      normalizedCreatedModule,
    ])

    const didPersistOrder = await persistWorkspaceModuleOrder(
      nextModules,
      normalizedCreatedModule.id,
      {
        useTemporaryOrders: false,
        errorMessage: "Failed to normalize module order after create.",
      }
    )

    if (didPersistOrder) {
      prepareCreateModule()
    }

    return didPersistOrder
  }

  async function updateModule() {
    if (
      !editingModule ||
      isUpdatingModule ||
      isCreatingModule ||
      isResettingModules ||
      deletingModuleId ||
      movingModuleId
    ) {
      return false
    }

    const trimmedTitle = editModuleForm.title.trim()
    const previousModules = workspaceModules
    const nextModules = workspaceModules.map((module) =>
      module.id === editingModule.id
        ? {
            ...module,
            title: trimmedTitle,
            type: editModuleForm.type,
          }
        : module
    )

    setModuleError("")
    setIsUpdatingModule(true)
    setWorkspaceModules(nextModules)

    const { data, error, status, statusText } = await supabase
      .from("project_modules")
      .update({
        title: trimmedTitle,
        type: editModuleForm.type,
      })
      .eq("id", editingModule.id)
      .eq("project_id", projectId)
      .select("id,title,type,order")
      .single()

    logSupabaseMutationResult("Project module update", {
      data,
      error,
      status,
      statusText,
    })

    setIsUpdatingModule(false)

    if (error) {
      setWorkspaceModules(previousModules)
      setModuleError("Failed to update module. Please try again.")
      return false
    }

    const normalizedUpdatedModule = mapWorkspaceModules([
      data as ProjectModuleRecord,
    ])[0]

    if (normalizedUpdatedModule) {
      setWorkspaceModules((current) =>
        current.map((module) =>
          module.id === normalizedUpdatedModule.id
            ? normalizedUpdatedModule
            : module
        )
      )
    }

    resetEditModuleDraft()
    return true
  }

  async function deleteModule(moduleId: string) {
    if (deletingModuleId || isResettingModules || movingModuleId) return false

    setModuleError("")
    setDeletingModuleId(moduleId)

    const { error } = await supabase
      .from("project_modules")
      .delete()
      .eq("id", moduleId)
      .eq("project_id", projectId)

    setDeletingModuleId(null)

    if (error) {
      if (isProjectModulesSchemaMissingError(error)) {
        console.warn(
          "Project modules table is unavailable. Module delete is disabled until the migration is applied.",
          error
        )
      } else {
        console.error("Project module delete failed:", error)
      }

      setModuleError("Failed to delete module. Please try again.")
      return false
    }

    const nextModules = normalizeWorkspaceModuleOrder(
      workspaceModules.filter((module) => module.id !== moduleId)
    )

    setWorkspaceModules(nextModules)

    if (nextModules.length > 0) {
      return persistWorkspaceModuleOrder(nextModules, null, {
        useTemporaryOrders: false,
        restoreOnFailure: false,
        errorMessage: "Module was deleted, but order cleanup failed.",
      })
    }

    await loadWorkspaceModules()
    return true
  }

  async function resetModules() {
    if (isResettingModules || isCreatingModule || deletingModuleId || movingModuleId) {
      return false
    }

    setModuleError("")
    setIsResettingModules(true)

    const { error: deleteError } = await supabase
      .from("project_modules")
      .delete()
      .eq("project_id", projectId)

    if (deleteError) {
      console.error("Project module reset delete failed:", deleteError)
      setModuleError("Failed to reset modules. Please try again.")
      setIsResettingModules(false)
      return false
    }

    const { error: insertError } = await supabase
      .from("project_modules")
      .insert(getDefaultProjectModuleRows(projectId))

    if (insertError) {
      console.error("Project module reset insert failed:", insertError)
      setModuleError("Failed to recreate default modules. Please try again.")
      setIsResettingModules(false)
      return false
    }

    await loadWorkspaceModules()
    setIsResettingModules(false)
    return true
  }

  return {
    clearModuleError,
    createModule,
    createModuleForm,
    deleteModule,
    deletingModuleId,
    editModuleForm,
    editingModule,
    hasCreateModuleChanges,
    hasEditModuleChanges,
    isCreatingModule,
    isResettingModules,
    isUpdatingModule,
    moduleError,
    movingModuleId,
    persistWorkspaceModuleOrder,
    prepareCreateModule,
    prepareEditModule,
    resetEditModuleDraft,
    resetModules,
    setCreateModuleForm,
    setEditModuleForm,
    sortedWorkspaceModules,
    updateModule,
    workspaceModules,
  }
}
