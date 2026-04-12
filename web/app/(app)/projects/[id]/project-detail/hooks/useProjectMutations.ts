"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type {
  Project,
  ProjectVisibility,
} from "@/lib/projects"
import {
  validateProjectForm,
  type ProjectFormErrors,
} from "@/lib/project-validation"
import { supabase } from "@/lib/supabase"

export type ProjectEditForm = {
  name: string
  description: string
  due_date: string
  visibility: ProjectVisibility
}

function createProjectEditForm(project: Project): ProjectEditForm {
  return {
    name: project.name,
    description: project.description ?? "",
    due_date: project.due_date ?? "",
    visibility: project.visibility,
  }
}

export function useProjectMutations({
  project,
  canCreatePrivateProject,
}: {
  project: Project
  canCreatePrivateProject: boolean
}) {
  const router = useRouter()
  const [currentProject, setCurrentProject] = useState<Project>(project)
  const [editForm, setEditForm] = useState<ProjectEditForm>(() =>
    createProjectEditForm(project)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingSummary, setIsSavingSummary] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [summaryError, setSummaryError] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [saveFieldErrors, setSaveFieldErrors] = useState<ProjectFormErrors>({})

  const hasEditProjectChanges = useMemo(
    () =>
      editForm.name !== currentProject.name ||
      editForm.description !== (currentProject.description ?? "") ||
      editForm.due_date !== (currentProject.due_date ?? "") ||
      editForm.visibility !== currentProject.visibility,
    [currentProject, editForm]
  )

  function beginEditingProject() {
    setEditForm(createProjectEditForm(currentProject))
    setSaveError("")
    setSaveFieldErrors({})
  }

  function clearProjectDeleteError() {
    setDeleteError("")
  }

  function clearProjectSummaryError() {
    setSummaryError("")
  }

  async function persistProjectSummaryFields({
    health,
    status,
  }: Pick<Project, "health" | "status">) {
    const { error } = await supabase.from("project_progress").upsert(
      {
        project_id: currentProject.id,
        status,
        health,
      },
      { onConflict: "project_id" }
    )

    return error
  }

  async function updateProject() {
    if (isSaving) return false

    setSaveError("")

    const validation = validateProjectForm(
      {
        name: editForm.name,
        description: editForm.description,
        due_date: editForm.due_date,
        visibility: editForm.visibility,
      },
      editForm.visibility === "private" || canCreatePrivateProject
    )

    setSaveFieldErrors(validation.errors)

    if (!validation.isValid) return false

    setIsSaving(true)

    const projectUpdates = {
      name: validation.values.name,
      description: validation.values.description,
      due_date: validation.values.due_date,
      visibility: validation.values.visibility,
    }

    const { error: projectError } = await supabase
      .from("projects")
      .update(projectUpdates)
      .eq("id", currentProject.id)

    if (projectError) {
      setIsSaving(false)
      setSaveError("Failed to update project. Please try again.")
      return false
    }

    const progressError = await persistProjectSummaryFields({
      health: currentProject.health,
      status: currentProject.status,
    })

    setIsSaving(false)

    if (progressError) {
      setSaveError("Failed to update project progress. Please try again.")
      return false
    }

    setCurrentProject((current) => ({
      ...current,
      ...projectUpdates,
    }))
    router.refresh()
    return true
  }

  async function updateProjectSummaryFields(
    updates: Pick<Project, "health" | "status">
  ) {
    if (isSavingSummary) return false

    setSummaryError("")
    setIsSavingSummary(true)

    const progressError = await persistProjectSummaryFields(updates)

    setIsSavingSummary(false)

    if (progressError) {
      setSummaryError("Failed to update project health. Please try again.")
      return false
    }

    setCurrentProject((current) => ({
      ...current,
      status: updates.status,
      health: updates.health,
    }))
    router.refresh()
    return true
  }

  async function deleteProject() {
    if (isDeleting) return false

    setDeleteError("")
    setIsDeleting(true)

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", currentProject.id)

    setIsDeleting(false)

    if (error) {
      setDeleteError("Failed to delete project. Please try again.")
      return false
    }

    return true
  }

  return {
    beginEditingProject,
    clearProjectDeleteError,
    clearProjectSummaryError,
    currentProject,
    deleteError,
    deleteProject,
    editForm,
    hasEditProjectChanges,
    isDeleting,
    isSaving,
    isSavingSummary,
    saveError,
    saveFieldErrors,
    setEditForm,
    setSaveFieldErrors,
    summaryError,
    updateProject,
    updateProjectSummaryFields,
  }
}
