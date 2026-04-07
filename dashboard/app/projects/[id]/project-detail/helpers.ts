import type {
  ProjectMetadata,
  ProjectTask,
} from "@/lib/projects"
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
export const projectModuleStackGapClassName = "space-y-8"
export const taskFilterOptions: Array<{
  label: string
  value: "all" | "overdue" | "upcoming" | "completed"
}> = [
  { label: "All", value: "all" },
  { label: "Overdue", value: "overdue" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
]

export const customProjectModuleOptions: Array<{
  label: string
  value: ProjectModuleType
}> = [
  { label: "Text Grid", value: "text_grid" },
  { label: "Notes", value: "notes" },
  { label: "Checklist", value: "checklist" },
  { label: "Timeline", value: "timeline" },
  { label: "Assets", value: "assets" },
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

export function isTaskOverdue(task: ProjectTask) {
  return getTaskStatusByDueDate(task) === "overdue"
}

export function getTaskStatusBadge(task: ProjectTask) {
  const dueDateLabel = getTaskDueDateValue(task.due_date)
  const dueStatus = getTaskStatusByDueDate(task)

  if (dueStatus === "completed") {
    return {
      label: "Completed",
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

    const aHasDueDate = Boolean(a.due_date)
    const bHasDueDate = Boolean(b.due_date)

    if (aHasDueDate !== bHasDueDate) {
      return aHasDueDate ? -1 : 1
    }

    if (a.due_date && b.due_date && a.due_date !== b.due_date) {
      return a.due_date.localeCompare(b.due_date)
    }

    if (a.order !== b.order) {
      return a.order - b.order
    }

    const createdAtDifference = a.created_at.localeCompare(b.created_at)

    if (createdAtDifference !== 0) {
      return createdAtDifference
    }

    return a.id - b.id
  })
}

export function filterTasksByView(
  tasks: ProjectTask[],
  filter: "all" | "overdue" | "upcoming" | "completed"
) {
  if (filter === "completed") {
    return tasks.filter((task) => task.completed)
  }

  if (filter === "overdue") {
    return tasks.filter((task) => isTaskOverdue(task))
  }

  if (filter === "upcoming") {
    return tasks.filter((task) => {
      const dueStatus = getTaskStatusByDueDate(task)

      return dueStatus === "due_today" || dueStatus === "due_soon" || dueStatus === "future"
    })
  }

  return tasks
}

export function getTaskCounts(tasks: ProjectTask[]) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.completed).length,
    overdue: tasks.filter((task) => isTaskOverdue(task)).length,
    upcoming: tasks.filter((task) => {
      const dueStatus = getTaskStatusByDueDate(task)

      return dueStatus === "due_today" || dueStatus === "due_soon" || dueStatus === "future"
    }).length,
  }
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

export function isProjectModuleInstanceId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export function humanizeProjectModuleType(type: ProjectModuleType | "tasks") {
  if (type === "workspace_plan") return "Workspace Plan"
  if (type === "planning_operations") return "Planning / Operations"
  if (type === "checklist" || type === "tasks") return "Checklist"
  if (type === "text_grid") return "Text Grid"

  return type
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function getProjectModuleDisplayTitle(module: {
  title: string
  type: ProjectModuleType | "tasks"
}) {
  const normalizedTitle = module.title.trim()

  return normalizedTitle || humanizeProjectModuleType(module.type)
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
  return `module-${module.id}`
}

export function mapWorkspaceModules(moduleRows: ProjectModuleRecord[]) {
  return moduleRows
    .map((module) => ({
      id: module.id,
      title: getProjectModuleDisplayTitle(module),
      type: module.type === "tasks" ? "checklist" : module.type,
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
  return modules.map((module, moduleIndex) => ({
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

export function reorderWorkspaceModulesBySlot(
  modules: ProjectWorkspaceModule[],
  draggedModuleId: string,
  slotIndex: number | null
) {
  const sortedModules = [...modules].sort(
    (firstModule, secondModule) => firstModule.order - secondModule.order
  )
  const draggedModuleIndex = sortedModules.findIndex(
    (module) => module.id === draggedModuleId
  )

  if (draggedModuleIndex === -1 || slotIndex === null) {
    return normalizeWorkspaceModuleOrder(sortedModules)
  }

  const reorderedModules = [...sortedModules]
  const [draggedModule] = reorderedModules.splice(draggedModuleIndex, 1)
  const normalizedSlotIndex = Math.max(
    0,
    Math.min(slotIndex, reorderedModules.length)
  )

  reorderedModules.splice(normalizedSlotIndex, 0, draggedModule)

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

export function isProjectTimelineEventsSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes(
      "Could not find the table 'public.project_timeline_events'"
    )
  )
}

export function isProjectAssetsSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes("Could not find the table 'public.project_assets'")
  )
}

export function isProjectModuleNotesSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes("Could not find the table 'public.project_module_notes'")
  )
}

export function isProjectModuleMetricsSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes(
      "Could not find the table 'public.project_module_metrics'"
    )
  )
}

export function isProjectModuleTextGridSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes(
      "Could not find the table 'public.project_module_text_grid_rows'"
    )
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
