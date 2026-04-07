"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import {
  validateProjectForm,
  type ProjectFormErrors,
} from "@/lib/project-validation"
import {
  mergeProjectWithProgress,
  type Project,
  type ProjectVisibility,
  type ProjectRow,
} from "@/lib/projects"
import { supabase } from "@/lib/supabase"

type UseCreateProjectFormParams = {
  currentUser: User | null
  onProjectCreated: (project: Project) => void
  onProjectCreateFailed: (message: string) => void
  onProjectCreatedClose: () => void
}

type UseCreateProjectFormResult = {
  name: string
  description: string
  dueDate: string
  visibility: ProjectVisibility
  errors: ProjectFormErrors
  isSaving: boolean
  setName: React.Dispatch<React.SetStateAction<string>>
  setDescription: React.Dispatch<React.SetStateAction<string>>
  setDueDate: React.Dispatch<React.SetStateAction<string>>
  setVisibility: React.Dispatch<React.SetStateAction<ProjectVisibility>>
  clearFieldError: (field: keyof ProjectFormErrors) => void
  resetForm: () => void
  createProject: () => Promise<void>
}

const initialVisibility: ProjectVisibility = "public"

export function useCreateProjectForm({
  currentUser,
  onProjectCreated,
  onProjectCreateFailed,
  onProjectCreatedClose,
}: UseCreateProjectFormParams): UseCreateProjectFormResult {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [visibility, setVisibility] =
    useState<ProjectVisibility>(initialVisibility)
  const [errors, setErrors] = useState<ProjectFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  function resetForm() {
    setName("")
    setDescription("")
    setDueDate("")
    setVisibility(initialVisibility)
    setErrors({})
  }

  function clearFieldError(field: keyof ProjectFormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function createProject() {
    if (isSaving) return

    const validation = validateProjectForm(
      {
        name,
        description,
        due_date: dueDate,
        progress: 0,
        visibility,
      },
      Boolean(currentUser)
    )

    setErrors(validation.errors)

    if (!validation.isValid) return

    setIsSaving(true)

    const { data, error } = await supabase
      .rpc("create_project_with_default_modules", {
        p_name: validation.values.name,
        p_description: validation.values.description,
        p_due_date: validation.values.due_date,
        p_visibility: validation.values.visibility,
      })
      .single<Project>()

    setIsSaving(false)

    if (error) {
      console.error("Error creating project:", error)
      onProjectCreateFailed("Failed to create project. Please try again.")
      return
    }

    if (data) {
      onProjectCreated(mergeProjectWithProgress(data as ProjectRow, null))
    }

    resetForm()
    onProjectCreatedClose()
  }

  return {
    name,
    description,
    dueDate,
    visibility,
    errors,
    isSaving,
    setName,
    setDescription,
    setDueDate,
    setVisibility,
    clearFieldError,
    resetForm,
    createProject,
  }
}
