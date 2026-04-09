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

function getProjectCreationErrorMessage(error: {
  message?: string | null
  details?: string | null
  hint?: string | null
  code?: string | null
} | null) {
  if (!error) {
    return "Failed to create project. Please try again."
  }

  if (error.message === "new row violates row-level security policy for table \"projects\"") {
    return "Project creation is blocked by the current database policy."
  }

  if (error.message === "new row violates row-level security policy for table \"project_modules\"") {
    return "Project modules could not be created because of the current database policy."
  }

  return error.message || "Failed to create project. Please try again."
}

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

    console.info("[project create] starting", {
      currentUserId: currentUser?.id ?? null,
      isAnonymous: currentUser?.is_anonymous ?? null,
      visibility: validation.values.visibility,
    })

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
      console.error("[project create] rpc failed", {
        code: error.code ?? null,
        currentUserId: currentUser?.id ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
        isAnonymous: currentUser?.is_anonymous ?? null,
        message: error.message ?? null,
        visibility: validation.values.visibility,
      })
      onProjectCreateFailed(getProjectCreationErrorMessage(error))
      return
    }

    console.info("[project create] rpc succeeded", {
      currentUserId: currentUser?.id ?? null,
      data,
    })

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
