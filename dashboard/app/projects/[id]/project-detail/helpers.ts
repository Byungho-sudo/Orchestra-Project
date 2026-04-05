import type { Project, ProjectMetadata, ProjectTask } from "@/lib/projects"
import {
  defaultProjectModuleAnchors,
  type DefaultProjectModuleType,
} from "@/lib/project-modules"
import type {
  ModuleDropPosition,
  ProjectMetadataDraft,
  ProjectModuleRecord,
  ProjectModuleType,
  ProjectWorkspaceModule,
  TaskSaveState,
} from "./types"

export type TaskDueStatus =
  | "completed"
  | "overdue"
  | "due_today"
  | "due_soon"
  | "future"
  | "no_deadline"

export const detailCardClassName =
  "rounded-xl border border-slate-300 bg-slate-50 p-8 shadow-sm"
export const sectionCardClassName =
  "rounded-xl border border-slate-300 bg-slate-50 p-8 shadow-sm"
export const fieldCardClassName =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
export const taskDeleteUndoDurationMs = 8000
export const projectSectionAnchorOffsetPx = 24

export const customProjectModuleOptions: Array<{
  label: string
  value: ProjectModuleType
}> = [
  { label: "Text Grid", value: "text_grid" },
  { label: "Notes", value: "notes" },
  { label: "Checklist", value: "checklist" },
  { label: "Metrics", value: "metrics" },
  { label: "Links", value: "links" },
]

export function getTaskDueDateValue(dueDate: string | null) {
  return dueDate ? dueDate.slice(0, 10) : ""
}

export function getTaskCompletedDateValue(completedAt: string | null) {
  return completedAt ? completedAt.slice(0, 10) : ""
}

function parseTaskDateInput(dateValue: string) {
  if (!dateValue) return null

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)

  if (!dateMatch) return null

  const year = Number(dateMatch[1])
  const monthIndex = Number(dateMatch[2]) - 1
  const day = Number(dateMatch[3])
  const parsedDate = new Date(year, monthIndex, day)

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== monthIndex ||
    parsedDate.getDate() !== day
  ) {
    return null
  }

  parsedDate.setHours(0, 0, 0, 0)

  return parsedDate
}

export function normalizeTaskDueDateInput(dateValue: string) {
  const trimmedValue = dateValue.trim()

  if (!trimmedValue) return null

  return parseTaskDateInput(trimmedValue) ? trimmedValue : null
}

function getTaskStatusByDueDate(task: ProjectTask): TaskDueStatus {
  if (task.completed) return "completed"

  const dueDate = parseTaskDateInput(getTaskDueDateValue(task.due_date))

  if (!dueDate) return "no_deadline"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dayDifference = Math.round(
    (dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (dayDifference < 0) return "overdue"
  if (dayDifference === 0) return "due_today"
  if (dayDifference <= 2) return "due_soon"

  return "future"
}

export function getTaskStatusBadge(task: ProjectTask) {
  const dueDateLabel = getTaskDueDateValue(task.due_date)
  const dueStatus = getTaskStatusByDueDate(task)

  if (dueStatus === "completed") {
    return {
      label: `Completed - ${
        getTaskCompletedDateValue(task.completed_at) ||
        getTaskCompletedDateValue(new Date().toISOString())
      }`,
      className: "bg-green-100 text-green-700",
    }
  }

  if (dueStatus === "overdue") {
    return {
      label: `Overdue - ${dueDateLabel}`,
      className: "bg-red-100 text-red-700",
    }
  }

  if (dueStatus === "due_today") {
    return {
      label: `Due today - ${dueDateLabel}`,
      className: "bg-red-100 text-red-700",
    }
  }

  if (dueStatus === "due_soon") {
    return {
      label: `Due soon - ${dueDateLabel}`,
      className: "bg-amber-100 text-amber-700",
    }
  }

  if (dueStatus === "no_deadline") {
    return {
      label: "No deadline",
      className: "bg-slate-100 text-slate-600",
    }
  }

  return {
    label: `Due ${dueDateLabel}`,
    className: "bg-slate-100 text-slate-600",
  }
}

export function sortTasksByUrgency(tasks: ProjectTask[]) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    if (a.completed && b.completed) {
      const aCompletedAt = a.completed_at ?? ""
      const bCompletedAt = b.completed_at ?? ""

      if (aCompletedAt !== bCompletedAt) {
        return bCompletedAt.localeCompare(aCompletedAt)
      }

      const completedCreatedAtDifference = b.created_at.localeCompare(
        a.created_at
      )

      if (completedCreatedAtDifference !== 0) {
        return completedCreatedAtDifference
      }

      return b.id - a.id
    }

    const createdAtDifference = b.created_at.localeCompare(a.created_at)

    if (createdAtDifference !== 0) {
      return createdAtDifference
    }

    return b.id - a.id
  })
}

export function getTaskSaveStateLabel(taskSaveState: TaskSaveState) {
  if (taskSaveState === "saving") return "Saving..."
  if (taskSaveState === "saved") return "Saved"
  if (taskSaveState === "error") return "Error"
  return ""
}

export function getTaskSaveStateClassName(taskSaveState: TaskSaveState) {
  if (taskSaveState === "error") return "text-red-600"
  if (taskSaveState === "saved") return "text-emerald-600"
  return "text-slate-500"
}

export function normalizeProgressInputValue(value: string) {
  const digitsOnly = value.replace(/\D/g, "")

  if (!digitsOnly) return ""

  return String(Math.min(100, Number(digitsOnly)))
}

export function normalizeProgressOnBlur(value: string, fallbackProgress: number) {
  if (!value.trim()) return String(fallbackProgress)

  return String(Math.min(100, Math.max(0, Number(value))))
}

export function createMetadataDraft(
  metadata?: Partial<Pick<ProjectMetadata, "id" | "key" | "value" | "order">>
): ProjectMetadataDraft {
  return {
    id:
      metadata?.id ??
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `metadata-${Date.now()}-${Math.random()}`),
    key: metadata?.key ?? "",
    value: metadata?.value ?? "",
    order: metadata?.order ?? 0,
  }
}

export function mapProjectMetadata(metadataRows: ProjectMetadata[]) {
  return [...metadataRows]
    .sort((firstMetadata, secondMetadata) => {
      if (firstMetadata.order !== secondMetadata.order) {
        return firstMetadata.order - secondMetadata.order
      }

      return firstMetadata.created_at.localeCompare(secondMetadata.created_at)
    })
    .map((metadata, metadataIndex) => ({
      ...metadata,
      order: metadataIndex + 1,
    }))
}

export function createMetadataDrafts(metadataRows: ProjectMetadata[]) {
  return mapProjectMetadata(metadataRows).map((metadata) =>
    createMetadataDraft(metadata)
  )
}

export function normalizeMetadataDrafts(metadataRows: ProjectMetadataDraft[]) {
  return metadataRows
    .map((metadata) => ({
      ...metadata,
      key: metadata.key.trim(),
      value: metadata.value.trim(),
    }))
    .filter((metadata) => metadata.key || metadata.value)
    .map((metadata, metadataIndex) => ({
      ...metadata,
      order: metadataIndex + 1,
    }))
}

export function getProjectModuleAnchor(module: ProjectWorkspaceModule) {
  if (module.type in defaultProjectModuleAnchors) {
    return defaultProjectModuleAnchors[module.type as DefaultProjectModuleType]
  }

  return module.id
}

export function mapWorkspaceModules(moduleRows: ProjectModuleRecord[]) {
  return moduleRows
    .map((module) => ({
      id: module.id,
      title: module.title,
      type: module.type,
      order: module.order,
    }))
    .sort((firstModule, secondModule) => firstModule.order - secondModule.order)
    .map((module, moduleIndex) => ({
      ...module,
      order: moduleIndex,
    }))
}

export function normalizeWorkspaceModuleOrder(
  modules: ProjectWorkspaceModule[]
) {
  return [...modules]
    .sort((firstModule, secondModule) => firstModule.order - secondModule.order)
    .map((module, moduleIndex) => ({
    ...module,
    order: moduleIndex,
  }))
}

export function reorderWorkspaceModulesByDrop(
  modules: ProjectWorkspaceModule[],
  draggedModuleId: string,
  targetModuleId: string,
  dropPosition: ModuleDropPosition
) {
  const sortedModules = [...modules].sort(
    (firstModule, secondModule) => firstModule.order - secondModule.order
  )
  const draggedModuleIndex = sortedModules.findIndex(
    (module) => module.id === draggedModuleId
  )
  const targetModuleIndex = sortedModules.findIndex(
    (module) => module.id === targetModuleId
  )

  if (
    draggedModuleIndex === -1 ||
    targetModuleIndex === -1 ||
    draggedModuleId === targetModuleId
  ) {
    return normalizeWorkspaceModuleOrder(sortedModules)
  }

  const reorderedModules = [...sortedModules]
  const [draggedModule] = reorderedModules.splice(draggedModuleIndex, 1)

  let insertionIndex =
    dropPosition === "before" ? targetModuleIndex : targetModuleIndex + 1

  if (draggedModuleIndex < insertionIndex) {
    insertionIndex -= 1
  }

  reorderedModules.splice(insertionIndex, 0, draggedModule)

  return normalizeWorkspaceModuleOrder(reorderedModules)
}

export function isProjectModulesSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes("Could not find the table 'public.project_modules'")
  )
}

export function isProjectMetadataSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes("Could not find the table 'public.project_metadata'")
  )
}

export function logSupabaseMutationResult(
  label: string,
  result: {
    data: unknown
    error: unknown
    status: number
    statusText: string
  }
) {
  console.log(`${label} result:`, result)

  if (result.error) {
    console.error(`${label} failed:`, result.error)
    console.error(
      `${label} failed JSON:`,
      JSON.stringify(result.error, null, 2)
    )
    console.error(`${label} failed details:`, {
      name: (result.error as { name?: string })?.name,
      message: (result.error as { message?: string })?.message,
      code: (result.error as { code?: string })?.code,
      details: (result.error as { details?: string })?.details,
      hint: (result.error as { hint?: string })?.hint,
      status: result.status,
      statusText: result.statusText,
    })
  }
}

export function getProjectStatusOptions(): Array<{
  label: string
  value: Project["status"]
}> {
  return [
    { label: "Not started", value: "not_started" },
    { label: "In progress", value: "in_progress" },
    { label: "Blocked", value: "blocked" },
    { label: "Completed", value: "completed" },
  ]
}
