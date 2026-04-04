import type { ProjectVisibility } from "@/lib/projects"

export type ProjectFormValues = {
  name: string
  description: string
  due_date: string
  progress?: number | string
  visibility: ProjectVisibility
}

export type ProjectFormErrors = Partial<
  Record<keyof ProjectFormValues, string>
>

export type ValidProjectFormValues = {
  name: string
  description: string | null
  due_date: string | null
  progress?: number
  visibility: ProjectVisibility
}

export function validateProjectForm(
  values: ProjectFormValues,
  canUsePrivateVisibility: boolean
) {
  const errors: ProjectFormErrors = {}
  const normalizedName = values.name.trim()
  const normalizedDescription = values.description.trim()
  const normalizedDueDate = values.due_date.trim()

  if (!normalizedName) {
    errors.name = "Project name is required."
  } else if (normalizedName.length < 2) {
    errors.name = "Project name must be at least 2 characters."
  } else if (normalizedName.length > 80) {
    errors.name = "Project name must be 80 characters or fewer."
  }

  if (normalizedDescription.length > 500) {
    errors.description = "Description must be 500 characters or fewer."
  }

  if (normalizedDueDate && !isValidDateString(normalizedDueDate)) {
    errors.due_date = "Please enter a valid due date."
  }

  if (
    values.visibility !== "public" &&
    values.visibility !== "private"
  ) {
    errors.visibility = "Please choose a valid project visibility."
  } else if (values.visibility === "private" && !canUsePrivateVisibility) {
    errors.visibility = "Log in to create a private project."
  }

  let normalizedProgress: number | undefined

  if (values.progress !== undefined && values.progress !== "") {
    normalizedProgress = Number(values.progress)

    if (
      !Number.isFinite(normalizedProgress) ||
      normalizedProgress < 0 ||
      normalizedProgress > 100
    ) {
      errors.progress = "Progress must be a number between 0 and 100."
    }
  }

  return {
    errors,
    values: {
      name: normalizedName,
      description: normalizedDescription || null,
      due_date: normalizedDueDate || null,
      progress: normalizedProgress,
      visibility: values.visibility,
    },
    isValid: Object.keys(errors).length === 0,
  }
}

function isValidDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}
