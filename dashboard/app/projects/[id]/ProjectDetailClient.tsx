"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ModalShell } from "@/app/components/project-dashboard/ModalShell"
import {
  getDeadlineBadgeClass,
  getDeadlineBarClass,
  getDeadlineFill,
  getDeadlineStatus,
} from "@/lib/project-deadline"
import type {
  Project,
  ProjectTask,
  ProjectVisibility,
} from "@/lib/projects"
import {
  validateProjectForm,
  type ProjectFormErrors,
} from "@/lib/project-validation"
import {
  defaultProjectModuleAnchors,
  getDefaultProjectModuleRows,
  getDefaultProjectWorkspaceModules,
  type DefaultProjectModuleType,
} from "@/lib/project-modules"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/use-current-user"

type ProjectWorkspaceForm = {
  intention: string
  idea: string
  target_buyer: string
  product: string
  price: string
  tools: string
  supplier: string
  budget: string
  notes: string
}

type TaskDueStatus =
  | "completed"
  | "overdue"
  | "due_today"
  | "due_soon"
  | "future"
  | "no_deadline"

type TaskSaveState = "idle" | "saving" | "saved" | "error"

type ProjectModuleType =
  | DefaultProjectModuleType
  | "text_grid"
  | "notes"
  | "checklist"
  | "metrics"
  | "links"

type ProjectWorkspaceModule = {
  id: string
  title: string
  type: ProjectModuleType
  order: number
}

type ProjectModuleRecord = {
  id: string
  title: string
  type: ProjectModuleType
  order: number
}

type CreateProjectModuleForm = {
  title: string
  type: ProjectModuleType
}

const detailCardClassName =
  "rounded-xl border border-slate-300 bg-slate-50 p-8 shadow-sm"
const sectionCardClassName =
  "rounded-xl border border-slate-300 bg-slate-50 p-8 shadow-sm"
const fieldCardClassName =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
const taskDeleteUndoDurationMs = 8000
const projectWorkspaceNavigation = [
  { href: "#overview", label: "Overview" },
  { href: "#operations", label: "Operations" },
  { href: "#tasks", label: "Task Board" },
  { href: "#timeline", label: "Timeline" },
  { href: "#assets", label: "Assets" },
]
const customProjectModuleOptions: Array<{
  label: string
  value: ProjectModuleType
}> = [
  { label: "Text Grid", value: "text_grid" },
  { label: "Notes", value: "notes" },
  { label: "Checklist", value: "checklist" },
  { label: "Metrics", value: "metrics" },
  { label: "Links", value: "links" },
]

function getTaskDueDateValue(dueDate: string | null) {
  return dueDate ? dueDate.slice(0, 10) : ""
}

function getTaskCompletedDateValue(completedAt: string | null) {
  return completedAt ? completedAt.slice(0, 10) : ""
}

function parseTaskDueDate(dueDate: string | null) {
  const dateValue = getTaskDueDateValue(dueDate)

  if (!dateValue) return null

  return new Date(`${dateValue}T00:00:00`)
}

function isOverdue(task: ProjectTask) {
  if (task.completed) return false

  const dueDate = parseTaskDueDate(task.due_date)

  if (!dueDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return dueDate.getTime() < today.getTime()
}

function isDueSoon(task: ProjectTask) {
  if (task.completed || isOverdue(task)) return false

  const dueDate = parseTaskDueDate(task.due_date)

  if (!dueDate) return false

  const now = new Date()
  const dueSoonLimit = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  return dueDate.getTime() <= dueSoonLimit.getTime()
}

function getTaskDueBadge(task: ProjectTask) {
  if (!task.due_date) return null

  if (isOverdue(task)) {
    return {
      label: `Overdue - ${getTaskDueDateValue(task.due_date)}`,
      className: "bg-red-100 text-red-700",
    }
  }

  if (isDueSoon(task)) {
    return {
      label: `Due soon - ${getTaskDueDateValue(task.due_date)}`,
      className: "bg-amber-100 text-amber-700",
    }
  }

  if (isOverdue(task)) {
    return {
      label: `Overdue · ${getTaskDueDateValue(task.due_date)}`,
      className: "bg-red-100 text-red-700",
    }
  }

  if (isDueSoon(task)) {
    return {
      label: `Due soon · ${getTaskDueDateValue(task.due_date)}`,
      className: "bg-amber-100 text-amber-700",
    }
  }

  return {
    label: `Due ${getTaskDueDateValue(task.due_date)}`,
    className: "bg-slate-100 text-slate-600",
  }
}

void getTaskDueBadge

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

function normalizeTaskDueDateInput(dateValue: string) {
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

function getTaskStatusBadge(task: ProjectTask) {
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

function sortTasksByUrgency(tasks: ProjectTask[]) {
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

function getTaskSaveStateLabel(taskSaveState: TaskSaveState) {
  if (taskSaveState === "saving") return "Saving..."
  if (taskSaveState === "saved") return "Saved"
  if (taskSaveState === "error") return "Error"
  return ""
}

function getTaskSaveStateClassName(taskSaveState: TaskSaveState) {
  if (taskSaveState === "error") return "text-red-600"
  if (taskSaveState === "saved") return "text-emerald-600"
  return "text-slate-500"
}

function normalizeProgressInputValue(value: string) {
  const digitsOnly = value.replace(/\D/g, "")

  if (!digitsOnly) return ""

  return String(Math.min(100, Number(digitsOnly)))
}

function normalizeProgressOnBlur(value: string, fallbackProgress: number) {
  if (!value.trim()) return String(fallbackProgress)

  return String(Math.min(100, Math.max(0, Number(value))))
}

function getDerivedProjectStatus(project: Project) {
  if (project.progress === 100) {
    return "Completed"
  }

  const deadlineDate = parseTaskDateInput(getTaskDueDateValue(project.due_date))

  if (deadlineDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (deadlineDate.getTime() < today.getTime()) {
      return "Overdue"
    }
  }

  return "Active"
}

function WorkspaceValue({ value }: { value: string | null }) {
  return (
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
      {value?.trim() || <span className="text-slate-400">Not added yet</span>}
    </p>
  )
}

function getProjectModuleAnchor(module: ProjectWorkspaceModule) {
  if (module.type in defaultProjectModuleAnchors) {
    return defaultProjectModuleAnchors[module.type as DefaultProjectModuleType]
  }

  return module.id
}

function ProjectModule({
  module,
  isFirst,
  isLast,
  isDeleting,
  isMoving,
  onDelete,
  onMoveDown,
  onMoveUp,
  children,
}: {
  module: ProjectWorkspaceModule
  isFirst: boolean
  isLast: boolean
  isDeleting: boolean
  isMoving: boolean
  onDelete: (moduleId: string) => void
  onMoveDown: (moduleId: string) => void
  onMoveUp: (moduleId: string) => void
  children: ReactNode
}) {
  return (
    <section
      id={getProjectModuleAnchor(module)}
      className={sectionCardClassName}
    >
      <div className="mb-4 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => onMoveUp(module.id)}
          disabled={isFirst || isMoving || isDeleting}
          className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Move Up
        </button>

        <button
          type="button"
          onClick={() => onMoveDown(module.id)}
          disabled={isLast || isMoving || isDeleting}
          className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Move Down
        </button>
      </div>

      {children}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => onDelete(module.id)}
          disabled={isDeleting}
          className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete Module"}
        </button>
      </div>
    </section>
  )
}

function CustomProjectModulePlaceholder({
  module,
}: {
  module: ProjectWorkspaceModule
}) {
  const moduleDescriptions: Partial<Record<ProjectModuleType, string>> = {
    text_grid: "Organize structured text fields in this module.",
    notes: "Capture long-form notes and working context here.",
    checklist: "Track custom checklist items in this module.",
    metrics: "Summarize key project metrics in this module.",
    links: "Collect important project links and references here.",
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {module.title}
      </p>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        {moduleDescriptions[module.type] ||
          "This custom module is ready for a future content pass."}
      </p>
    </>
  )
}

function mapWorkspaceModules(moduleRows: ProjectModuleRecord[]) {
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
      order: moduleIndex + 1,
    }))
}

function isProjectModulesSchemaMissingError(error: unknown) {
  const errorCode = (error as { code?: string } | null)?.code
  const errorMessage = (error as { message?: string } | null)?.message || ""

  return (
    errorCode === "PGRST205" ||
    errorMessage.includes("Could not find the table 'public.project_modules'")
  )
}

function logSupabaseMutationResult(
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

export default function ProjectDetailClient({
  project,
}: {
  project: Project
}) {
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()

  const [currentProject, setCurrentProject] = useState<Project>(project)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [workspaceModules, setWorkspaceModules] =
    useState<ProjectWorkspaceModule[]>(getDefaultProjectWorkspaceModules())

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isWorkspaceEditOpen, setIsWorkspaceEditOpen] = useState(false)
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [isSavingTasks, setIsSavingTasks] = useState(false)
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)
  const [movingModuleId, setMovingModuleId] = useState<string | null>(null)
  const [isResettingModules, setIsResettingModules] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [workspaceError, setWorkspaceError] = useState("")
  const [moduleError, setModuleError] = useState("")
  const [taskError, setTaskError] = useState("")
  const [taskSaveState, setTaskSaveState] = useState<TaskSaveState>("idle")
  const [saveFieldErrors, setSaveFieldErrors] = useState<ProjectFormErrors>({})
  const [deleteError, setDeleteError] = useState("")
  const [newTaskText, setNewTaskText] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [taskInputError, setTaskInputError] = useState(false)
  const [pendingDeletedTask, setPendingDeletedTask] =
    useState<ProjectTask | null>(null)
  const [isUndoTimerRunning, setIsUndoTimerRunning] = useState(false)
  const newTaskInputRef = useRef<HTMLInputElement | null>(null)
  const taskSaveResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const taskDeleteUndoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const pendingDeletedTaskRef = useRef<ProjectTask | null>(null)

  const [editForm, setEditForm] = useState({
    name: currentProject.name,
    description: currentProject.description ?? "",
    progress: String(currentProject.progress),
    due_date: currentProject.due_date ?? "",
    visibility: currentProject.visibility,
  })

  const [workspaceForm, setWorkspaceForm] = useState<ProjectWorkspaceForm>({
    intention: currentProject.intention ?? "",
    idea: currentProject.idea ?? "",
    target_buyer: currentProject.target_buyer ?? "",
    product: currentProject.product ?? "",
    price: currentProject.price ?? "",
    tools: currentProject.tools ?? "",
    supplier: currentProject.supplier ?? "",
    budget: currentProject.budget ?? "",
    notes: currentProject.notes ?? "",
  })
  const [createModuleForm, setCreateModuleForm] =
    useState<CreateProjectModuleForm>({
      title: "",
      type: "notes",
    })

  const loadWorkspaceModules = useCallback(async () => {
    const { data, error, status, statusText } = await supabase
      .from("project_modules")
      .select("id,title,type,order")
      .eq("project_id", currentProject.id)
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
        moduleRows.some((moduleRow, moduleIndex) => moduleRow.order !== moduleIndex + 1)
      ) {
        const normalizeResults = await Promise.all(
          normalizedModules.map((module) =>
            supabase
              .from("project_modules")
              .update({ order: module.order })
              .eq("id", module.id)
              .eq("project_id", currentProject.id)
          )
        )
        const normalizeError = normalizeResults.find(
          (result) => result.error
        )?.error

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
      .insert(getDefaultProjectModuleRows(currentProject.id))
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

    setWorkspaceModules(
      mapWorkspaceModules((defaultModulesData as ProjectModuleRecord[]) || [])
    )
  }, [currentProject.id])

  useEffect(() => {
    async function loadProjectTasks() {
      setTaskError("")

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", currentProject.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })

      console.log("Project tasks fetch result:", {
        data,
        error,
        status,
        statusText,
      })

      if (error) {
        console.error("Project tasks fetch failed:", error)
        console.error(
          "Project tasks fetch failed JSON:",
          JSON.stringify(error, null, 2)
        )
        setTaskError("Failed to load tasks. Please refresh and try again.")
        return
      }

      setTasks((data as ProjectTask[]) || [])
    }

    loadProjectTasks()
  }, [currentProject.id])

  useEffect(() => {
    loadWorkspaceModules()
  }, [loadWorkspaceModules])

  useEffect(() => {
    return () => {
      if (taskSaveResetTimeoutRef.current) {
        clearTimeout(taskSaveResetTimeoutRef.current)
      }

      if (taskDeleteUndoTimeoutRef.current) {
        clearTimeout(taskDeleteUndoTimeoutRef.current)
      }

    }
  }, [])

  function updateTaskSaveState(nextState: TaskSaveState) {
    if (taskSaveResetTimeoutRef.current) {
      clearTimeout(taskSaveResetTimeoutRef.current)
      taskSaveResetTimeoutRef.current = null
    }

    setTaskSaveState(nextState)

    if (nextState === "saved") {
      taskSaveResetTimeoutRef.current = setTimeout(() => {
        setTaskSaveState("idle")
        taskSaveResetTimeoutRef.current = null
      }, 1600)
    }
  }

  function clearPendingTaskDeleteTimeout() {
    if (taskDeleteUndoTimeoutRef.current) {
      clearTimeout(taskDeleteUndoTimeoutRef.current)
      taskDeleteUndoTimeoutRef.current = null
    }

  }

  async function commitTaskDelete(taskToDelete: ProjectTask) {
    setTaskError("")
    updateTaskSaveState("saving")

    try {
      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", taskToDelete.id)
        .eq("project_id", taskToDelete.project_id)
        .select("id")
        .single()

      logSupabaseMutationResult("Task delete", {
        data,
        error,
        status,
        statusText,
      })

      if (error) {
        throw error
      }

      updateTaskSaveState("saved")
      router.refresh()
    } catch (error) {
      console.error("Task delete failed:", error)
      console.error("Task delete failed JSON:", JSON.stringify(error, null, 2))
      setTasks((current) =>
        current.some((task) => task.id === taskToDelete.id)
          ? current
          : [...current, taskToDelete]
      )
      setTaskError("Failed to delete task. Please try again.")
      updateTaskSaveState("error")
    }
  }

  function closeEditProjectModal() {
    if (isSaving) return

    setIsEditOpen(false)
    setSaveError("")
    setSaveFieldErrors({})
  }

  function closeWorkspaceEditModal() {
    if (isSavingWorkspace) return

    setIsWorkspaceEditOpen(false)
    setWorkspaceError("")
  }

  function closeAddModuleModal() {
    if (isCreatingModule) return

    setIsAddModuleOpen(false)
    setModuleError("")
    setCreateModuleForm({
      title: "",
      type: "notes",
    })
  }

  function closeDeleteProjectModal() {
    if (isDeleting) return

    setIsDeleteOpen(false)
    setDeleteError("")
  }

  async function handleCreateWorkspaceModule() {
    if (isCreatingModule || isResettingModules || deletingModuleId || movingModuleId) {
      return
    }

    const moduleTitle = createModuleForm.title.trim()

    if (!moduleTitle) {
      setModuleError("Module title is required.")
      return
    }

    setModuleError("")
    setIsCreatingModule(true)

    const nextOrder =
      Math.max(0, ...workspaceModules.map((module) => module.order)) + 1

    const { data, error, status, statusText } = await supabase
      .from("project_modules")
      .insert({
        project_id: currentProject.id,
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
        return
      }

      setModuleError("Failed to create module. Please try again.")
      return
    }

    await loadWorkspaceModules()
    closeAddModuleModal()
  }

  async function handleDeleteWorkspaceModule(moduleId: string) {
    if (deletingModuleId || isResettingModules || movingModuleId) return

    setModuleError("")
    setDeletingModuleId(moduleId)

    const { error } = await supabase
      .from("project_modules")
      .delete()
      .eq("id", moduleId)
      .eq("project_id", currentProject.id)

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
      return
    }

    const nextModules = workspaceModules
      .filter((module) => module.id !== moduleId)
      .sort((firstModule, secondModule) => firstModule.order - secondModule.order)
      .map((module, moduleIndex) => ({
        ...module,
        order: moduleIndex + 1,
      }))

    if (nextModules.length > 0) {
      const updateResults = await Promise.all(
        nextModules.map((module) =>
          supabase
            .from("project_modules")
            .update({ order: module.order })
            .eq("id", module.id)
            .eq("project_id", currentProject.id)
        )
      )

      const updateError = updateResults.find((result) => result.error)?.error

      if (updateError) {
        console.error("Project module reorder after delete failed:", updateError)
        setModuleError("Module was deleted, but order cleanup failed.")
      }
    }

    await loadWorkspaceModules()
  }

  async function handleMoveWorkspaceModule(
    moduleId: string,
    direction: "up" | "down"
  ) {
    if (movingModuleId || deletingModuleId || isResettingModules || isCreatingModule) {
      return
    }

    const sortedModules = [...workspaceModules].sort(
      (firstModule, secondModule) => firstModule.order - secondModule.order
    )
    const moduleIndex = sortedModules.findIndex(
      (module) => module.id === moduleId
    )
    const swapIndex = direction === "up" ? moduleIndex - 1 : moduleIndex + 1

    if (
      moduleIndex === -1 ||
      swapIndex < 0 ||
      swapIndex >= sortedModules.length
    ) {
      return
    }

    const currentModule = sortedModules[moduleIndex]
    const adjacentModule = sortedModules[swapIndex]
    const temporaryOrder = -1

    setModuleError("")
    setMovingModuleId(moduleId)

    const moveCurrentToTemporaryResult = await supabase
      .from("project_modules")
      .update({ order: temporaryOrder })
      .eq("id", currentModule.id)
      .eq("project_id", currentProject.id)

    if (moveCurrentToTemporaryResult.error) {
      setMovingModuleId(null)
      console.error(
        "Project module move failed while reserving temporary order:",
        moveCurrentToTemporaryResult.error
      )
      setModuleError("Failed to reorder module. Please try again.")
      return
    }

    const moveAdjacentIntoCurrentOrderResult = await supabase
      .from("project_modules")
      .update({ order: currentModule.order })
      .eq("id", adjacentModule.id)
      .eq("project_id", currentProject.id)

    if (moveAdjacentIntoCurrentOrderResult.error) {
      await supabase
        .from("project_modules")
        .update({ order: currentModule.order })
        .eq("id", currentModule.id)
        .eq("project_id", currentProject.id)

      setMovingModuleId(null)
      console.error(
        "Project module move failed while shifting adjacent module:",
        moveAdjacentIntoCurrentOrderResult.error
      )
      setModuleError("Failed to reorder module. Please try again.")
      return
    }

    const moveCurrentIntoAdjacentOrderResult = await supabase
      .from("project_modules")
      .update({ order: adjacentModule.order })
      .eq("id", currentModule.id)
      .eq("project_id", currentProject.id)

    setMovingModuleId(null)

    if (moveCurrentIntoAdjacentOrderResult.error) {
      setModuleError("Failed to reorder module. Please try again.")
      console.error(
        "Project module move failed while finalizing swap:",
        moveCurrentIntoAdjacentOrderResult.error
      )
      return
    }

    await loadWorkspaceModules()
  }

  async function handleResetWorkspaceModules() {
    if (isResettingModules || isCreatingModule || deletingModuleId || movingModuleId) {
      return
    }

    setModuleError("")
    setIsResettingModules(true)

    const { error: deleteError } = await supabase
      .from("project_modules")
      .delete()
      .eq("project_id", currentProject.id)

    if (deleteError) {
      console.error("Project module reset delete failed:", deleteError)
      setModuleError("Failed to reset modules. Please try again.")
      setIsResettingModules(false)
      return
    }

    const { error: insertError } = await supabase
      .from("project_modules")
      .insert(getDefaultProjectModuleRows(currentProject.id))

    if (insertError) {
      console.error("Project module reset insert failed:", insertError)
      setModuleError("Failed to recreate default modules. Please try again.")
      setIsResettingModules(false)
      return
    }

    await loadWorkspaceModules()
    setIsResettingModules(false)
  }

  async function handleUpdateProject() {
    if (isSaving) return

    setSaveError("")

    const validation = validateProjectForm(
      {
        name: editForm.name,
        description: editForm.description,
        due_date: editForm.due_date,
        progress: editForm.progress,
        visibility: editForm.visibility,
      },
      editForm.visibility === "private" || Boolean(currentUser)
    )

    setSaveFieldErrors(validation.errors)

    if (!validation.isValid) return

    setIsSaving(true)

    const updates = {
      name: validation.values.name,
      description: validation.values.description,
      progress: validation.values.progress ?? currentProject.progress,
      due_date: validation.values.due_date,
      visibility: validation.values.visibility,
    }

    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", currentProject.id)

    setIsSaving(false)

    if (error) {
      setSaveError("Failed to update project. Please try again.")
      return
    }

    setCurrentProject((current) => ({ ...current, ...updates }))
    setIsEditOpen(false)
    router.refresh()
  }

  async function handleUpdateWorkspace() {
    if (isSavingWorkspace) return

    const projectId = currentProject.id

    console.log("Updating projectId:", projectId)

    setWorkspaceError("")
    setIsSavingWorkspace(true)

    const updates = {
      intention: workspaceForm.intention.trim() || null,
      idea: workspaceForm.idea.trim() || null,
      target_buyer: workspaceForm.target_buyer.trim() || null,
      product: workspaceForm.product.trim() || null,
      price: workspaceForm.price.trim() || null,
      tools: workspaceForm.tools.trim() || null,
      supplier: workspaceForm.supplier.trim() || null,
      budget: workspaceForm.budget.trim() || null,
      notes: workspaceForm.notes.trim() || null,
    }

    try {
      const { data, error, status, statusText } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select("*")
        .single()

      logSupabaseMutationResult("Workspace update", {
        data,
        error,
        status,
        statusText,
      })

      if (error) {
        throw error
      }

      setCurrentProject({
        ...(data as Project),
      })
      setIsWorkspaceEditOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Workspace update failed:", error)
      console.error(
        "Workspace update failed JSON:",
        JSON.stringify(error, null, 2)
      )
      setWorkspaceError("Failed to save workspace. Please try again.")
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  async function handleAddTask() {
    if (isSavingTask || isSavingTasks) return

    const taskText = newTaskText.trim()

    if (!taskText) {
      setTaskInputError(true)
      return
    }

    const normalizedDueDate = normalizeTaskDueDateInput(newTaskDueDate)
    const temporaryTaskId = -Date.now()
    const temporaryTask: ProjectTask = {
      id: temporaryTaskId,
      project_id: currentProject.id,
      text: taskText,
      completed: false,
      completed_at: null,
      due_date: normalizedDueDate,
      created_at: new Date().toISOString(),
    }

    setTaskInputError(false)
    setTaskError("")
    setIsSavingTask(true)
    updateTaskSaveState("saving")
    setTasks((current) => [...current, temporaryTask])

    try {
      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .insert([
          {
            project_id: currentProject.id,
            text: taskText,
            completed: false,
            completed_at: null,
            due_date: normalizedDueDate,
          },
        ])
        .select("*")
        .single()

      logSupabaseMutationResult("Task update", {
        data,
        error,
        status,
        statusText,
      })

      if (error) {
        throw error
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === temporaryTaskId ? (data as ProjectTask) : task
        )
      )
      setNewTaskText("")
      setNewTaskDueDate("")
      updateTaskSaveState("saved")
      newTaskInputRef.current?.focus()
      router.refresh()
      return true
    } catch (error) {
      console.error("Task update failed:", error)
      console.error("Task update failed JSON:", JSON.stringify(error, null, 2))
      setTasks((current) =>
        current.filter((task) => task.id !== temporaryTaskId)
      )
      setTaskError("Failed to update tasks. Please try again.")
      updateTaskSaveState("error")
      return false
    } finally {
      setIsSavingTask(false)
    }
  }

  function handleNewTaskKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return

    event.preventDefault()

    if (!newTaskText.trim()) {
      setTaskInputError(true)
      return
    }

    void handleAddTask()
  }

  async function handleUpdateTaskDueDate(taskId: number, dueDate: string) {
    if (isSavingTasks) return

    setTaskError("")
    setIsSavingTasks(true)
    updateTaskSaveState("saving")

    try {
      const normalizedDueDate = normalizeTaskDueDateInput(dueDate)

      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .update({ due_date: normalizedDueDate })
        .eq("id", taskId)
        .eq("project_id", currentProject.id)
        .select("*")
        .single()

      logSupabaseMutationResult("Task due date update", {
        data,
        error,
        status,
        statusText,
      })

      if (error) {
        throw error
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? (data as ProjectTask) : task
        )
      )
      updateTaskSaveState("saved")
      router.refresh()
    } catch (error) {
      console.error("Task due date update failed:", error)
      console.error(
        "Task due date update failed JSON:",
        JSON.stringify(error, null, 2)
      )
      setTaskError("Failed to update task due date. Please try again.")
      updateTaskSaveState("error")
    } finally {
      setIsSavingTasks(false)
    }
  }

  async function handleToggleTask(taskId: number) {
    if (isSavingTasks) return

    const taskToUpdate = tasks.find((task) => task.id === taskId)

    if (!taskToUpdate) return

    setTaskError("")
    setIsSavingTasks(true)
    updateTaskSaveState("saving")

    try {
      const nextCompleted = !taskToUpdate.completed

      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .update({
          completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
        })
        .eq("id", taskId)
        .eq("project_id", currentProject.id)
        .select("*")
        .single()

      logSupabaseMutationResult("Task update", {
        data,
        error,
        status,
        statusText,
      })

      if (error) {
        throw error
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? (data as ProjectTask) : task
        )
      )
      updateTaskSaveState("saved")
      router.refresh()
    } catch (error) {
      console.error("Task update failed:", error)
      console.error("Task update failed JSON:", JSON.stringify(error, null, 2))
      setTaskError("Failed to update tasks. Please try again.")
      updateTaskSaveState("error")
    } finally {
      setIsSavingTasks(false)
    }
  }

  function handleDeleteTask(taskId: number) {
    if (isSavingTasks) return

    const taskToDelete = tasks.find((task) => task.id === taskId)

    if (!taskToDelete) return

    const previousPendingTask = pendingDeletedTaskRef.current

    clearPendingTaskDeleteTimeout()

    if (previousPendingTask) {
      void commitTaskDelete(previousPendingTask)
    }

    pendingDeletedTaskRef.current = taskToDelete
    setPendingDeletedTask(taskToDelete)
    setIsUndoTimerRunning(false)
    setTaskError("")
    setTasks((current) => current.filter((task) => task.id !== taskId))

    requestAnimationFrame(() => {
      setIsUndoTimerRunning(true)
    })

    taskDeleteUndoTimeoutRef.current = setTimeout(() => {
      const taskPendingDelete = pendingDeletedTaskRef.current

      if (!taskPendingDelete) return

      clearPendingTaskDeleteTimeout()
      pendingDeletedTaskRef.current = null
      setPendingDeletedTask(null)
      setIsUndoTimerRunning(false)
      void commitTaskDelete(taskPendingDelete)
    }, taskDeleteUndoDurationMs)
  }

  function handleUndoDeleteTask() {
    const taskToRestore = pendingDeletedTaskRef.current

    if (!taskToRestore) return

    clearPendingTaskDeleteTimeout()
    pendingDeletedTaskRef.current = null
    setPendingDeletedTask(null)
    setIsUndoTimerRunning(false)
    setTasks((current) =>
      current.some((task) => task.id === taskToRestore.id)
        ? current
        : [...current, taskToRestore]
    )
  }

  async function confirmDeleteProject() {
    if (isDeleting) return

    setDeleteError("")
    setIsDeleting(true)

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", currentProject.id)

    setIsDeleting(false)

    if (error) {
      setDeleteError("Failed to delete project. Please try again.")
      return
    }

    setIsDeleteOpen(false)
    router.push("/projects")
  }

  const deadlineStatus = getDeadlineStatus(currentProject.due_date)
  const sortedTasks = sortTasksByUrgency(tasks)
  const sortedWorkspaceModules = [...workspaceModules].sort(
    (firstModule, secondModule) => firstModule.order - secondModule.order
  )
  const hasEditProjectChanges =
    editForm.name !== currentProject.name ||
    editForm.description !== (currentProject.description ?? "") ||
    editForm.progress !== String(currentProject.progress) ||
    editForm.due_date !== (currentProject.due_date ?? "") ||
    editForm.visibility !== currentProject.visibility
  const hasWorkspaceChanges =
    workspaceForm.intention !== (currentProject.intention ?? "") ||
    workspaceForm.idea !== (currentProject.idea ?? "") ||
    workspaceForm.target_buyer !== (currentProject.target_buyer ?? "") ||
    workspaceForm.product !== (currentProject.product ?? "") ||
    workspaceForm.price !== (currentProject.price ?? "") ||
    workspaceForm.tools !== (currentProject.tools ?? "") ||
    workspaceForm.supplier !== (currentProject.supplier ?? "") ||
    workspaceForm.budget !== (currentProject.budget ?? "") ||
    workspaceForm.notes !== (currentProject.notes ?? "")
  const hasCreateModuleChanges =
    createModuleForm.title.trim() !== "" || createModuleForm.type !== "notes"

  function renderProjectModuleContent(module: ProjectWorkspaceModule) {
    if (module.type === "workspace_plan") {
      return (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Project Overview
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {module.title}
              </h2>
            </div>

            <button
              onClick={() => {
                setWorkspaceForm({
                  intention: currentProject.intention ?? "",
                  idea: currentProject.idea ?? "",
                  target_buyer: currentProject.target_buyer ?? "",
                  product: currentProject.product ?? "",
                  price: currentProject.price ?? "",
                  tools: currentProject.tools ?? "",
                  supplier: currentProject.supplier ?? "",
                  budget: currentProject.budget ?? "",
                  notes: currentProject.notes ?? "",
                })
                setWorkspaceError("")
                setIsWorkspaceEditOpen(true)
              }}
              className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Edit Workspace
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Intention
              </p>
              <WorkspaceValue value={currentProject.intention} />
            </div>
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Idea
              </p>
              <WorkspaceValue value={currentProject.idea} />
            </div>
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Target Buyer
              </p>
              <WorkspaceValue value={currentProject.target_buyer} />
            </div>
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product
              </p>
              <WorkspaceValue value={currentProject.product} />
            </div>
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price
              </p>
              <WorkspaceValue value={currentProject.price} />
            </div>
          </div>
        </>
      )
    }

    if (module.type === "planning_operations") {
      return (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {module.title}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tools
              </p>
              <WorkspaceValue value={currentProject.tools} />
            </div>
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Supplier
              </p>
              <WorkspaceValue value={currentProject.supplier} />
            </div>
            <div className={fieldCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Budget
              </p>
              <WorkspaceValue value={currentProject.budget} />
            </div>
            <div className={`${fieldCardClassName} md:col-span-2`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
              </p>
              <WorkspaceValue value={currentProject.notes} />
            </div>
          </div>
        </>
      )
    }

    if (module.type === "tasks") {
      return (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {module.title}
            </p>

            {taskSaveState !== "idle" && (
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${getTaskSaveStateClassName(
                  taskSaveState
                )}`}
              >
                {getTaskSaveStateLabel(taskSaveState)}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              ref={newTaskInputRef}
              type="text"
              value={newTaskText}
              onChange={(event) => {
                setNewTaskText(event.target.value)
                if (taskInputError && event.target.value.trim()) {
                  setTaskInputError(false)
                }
              }}
              onKeyDown={handleNewTaskKeyDown}
              placeholder="Add a new task"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500 ${
                taskInputError
                  ? "border-red-300 bg-red-50"
                  : "border-slate-300"
              }`}
            />
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(event) => setNewTaskDueDate(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 sm:w-40"
            />
            <button
              onClick={handleAddTask}
              disabled={isSavingTask || !newTaskText.trim()}
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Task
            </button>
          </div>

          {taskError && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {taskError}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {sortedTasks.length === 0 && (
              <p className="text-sm text-slate-400">Not added yet</p>
            )}

            {sortedTasks.map((task) => {
              const taskStatusBadge = getTaskStatusBadge(task)

              return (
                <div
                  key={task.id}
                  className={`flex flex-col gap-3 rounded-xl border border-slate-200 p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between ${
                    task.completed
                      ? "bg-slate-50 opacity-80"
                      : "bg-white opacity-100"
                  }`}
                >
                  <label className="flex flex-1 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      disabled={isSavingTasks}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span
                      className={
                        task.completed
                          ? "text-slate-400 line-through transition-all duration-200"
                          : "text-slate-700 transition-all duration-200"
                      }
                    >
                      {task.text}
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <input
                      type="date"
                      value={getTaskDueDateValue(task.due_date)}
                      onChange={(event) =>
                        handleUpdateTaskDueDate(task.id, event.target.value)
                      }
                      disabled={isSavingTasks}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${taskStatusBadge.className}`}
                    >
                      {taskStatusBadge.label}
                    </span>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={isSavingTasks}
                      className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              pendingDeletedTask
                ? "mt-4 max-h-24 opacity-100"
                : "mt-0 max-h-0 opacity-0"
            }`}
          >
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 [&>button]:hidden [&>span]:hidden">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  Deleted: {pendingDeletedTask?.text ?? ""}
                </span>
                <button
                  type="button"
                  onClick={handleUndoDeleteTask}
                  className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
                >
                  Undo
                </button>
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full origin-left rounded-full bg-indigo-500 transition-transform ease-linear"
                  style={{
                    transform: isUndoTimerRunning ? "scaleX(0)" : "scaleX(1)",
                    transitionDuration: `${taskDeleteUndoDurationMs}ms`,
                  }}
                />
              </div>
              <span>Task deleted â€” Undo</span>
              <button
                type="button"
                onClick={handleUndoDeleteTask}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Undo
              </button>
            </div>
          </div>
        </>
      )
    }

    if (module.type === "timeline") {
      return (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {module.title}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Timeline details can be organized here in a future pass.
          </p>
        </>
      )
    }

    if (module.type === "assets") {
      return (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {module.title}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Project assets can be organized here in a future pass.
          </p>
        </>
      )
    }

    return <CustomProjectModulePlaceholder module={module} />
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[180px_minmax(0,1fr)_300px] lg:items-start">
          <aside className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Navigation
            </h2>

            <nav className="flex flex-wrap gap-2 text-sm lg:flex-col">
              {projectWorkspaceNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
          <div className="mb-6 hidden items-center justify-between">
            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Back to projects
            </Link>

            {currentUser ? (
              <button
                onClick={logout}
                className="hidden rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden text-sm font-medium text-slate-700 hover:underline"
              >
                Log in
              </Link>
            )}
          </div>

          <div className={detailCardClassName}>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <Link
                  href="/projects"
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Back to projects
                </Link>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Project Detail
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {currentProject.name}
                </h1>

                <p className="mt-4 text-base leading-7 text-slate-600">
                  {currentProject.description?.trim() ||
                    "No description provided."}
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {currentProject.id}
                </p>
              </div>
            </div>

            <div className="mt-8 hidden gap-4 md:grid-cols-3">
              <div className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due Date
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {currentProject.due_date ?? "No due date"}
                </p>
              </div>

              <div className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Progress
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {currentProject.progress}%
                </p>
              </div>

              <div className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created At
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(currentProject.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-8 hidden space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Progress Bar
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {currentProject.progress}%
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-green-700 transition-all"
                    style={{ width: `${currentProject.progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Deadline Bar
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {deadlineStatus}
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${getDeadlineBarClass(
                      deadlineStatus
                    )}`}
                    style={{
                      width: `${getDeadlineFill(currentProject.due_date)}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {currentProject.due_date
                    ? `Due ${currentProject.due_date}`
                    : "No due date"}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDeadlineBadgeClass(
                      deadlineStatus
                    )}`}
                  >
                    {deadlineStatus}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-8 hidden flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to projects
              </Link>

              <button
                onClick={() => {
                  setEditForm({
                    name: currentProject.name,
                    description: currentProject.description ?? "",
                    progress: String(currentProject.progress),
                    due_date: currentProject.due_date ?? "",
                    visibility: currentProject.visibility,
                  })
                  setSaveError("")
                  setSaveFieldErrors({})
                  setIsEditOpen(true)
                }}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Edit Project
              </button>

              <button
                onClick={() => {
                  setDeleteError("")
                  setIsDeleteOpen(true)
                }}
                className="inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
              >
                Delete Project
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleResetWorkspaceModules}
                disabled={
                  isResettingModules ||
                  isCreatingModule ||
                  Boolean(deletingModuleId) ||
                  Boolean(movingModuleId)
                }
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResettingModules ? "Resetting..." : "Reset to default"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setModuleError("")
                  setCreateModuleForm({
                    title: "",
                    type: "notes",
                  })
                  setIsAddModuleOpen(true)
                }}
                disabled={
                  isResettingModules ||
                  isCreatingModule ||
                  Boolean(deletingModuleId) ||
                  Boolean(movingModuleId)
                }
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Module
              </button>
            </div>

            {moduleError && (
              <p className="text-sm font-medium text-red-600">{moduleError}</p>
            )}

            {sortedWorkspaceModules.map((module, moduleIndex) => (
              <ProjectModule
                key={module.id}
                module={module}
                isFirst={moduleIndex === 0}
                isLast={moduleIndex === sortedWorkspaceModules.length - 1}
                isDeleting={deletingModuleId === module.id || isResettingModules}
                isMoving={movingModuleId === module.id || isResettingModules}
                onDelete={handleDeleteWorkspaceModule}
                onMoveDown={(moduleId) =>
                  handleMoveWorkspaceModule(moduleId, "down")
                }
                onMoveUp={(moduleId) =>
                  handleMoveWorkspaceModule(moduleId, "up")
                }
              >
                {renderProjectModuleContent(module)}
              </ProjectModule>
            ))}
          </div>

          <div className="hidden">
            <section id="overview" className={sectionCardClassName}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Project Overview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Workspace Plan
                  </h2>
                </div>

                <button
                  onClick={() => {
                    setWorkspaceForm({
                      intention: currentProject.intention ?? "",
                      idea: currentProject.idea ?? "",
                      target_buyer: currentProject.target_buyer ?? "",
                      product: currentProject.product ?? "",
                      price: currentProject.price ?? "",
                      tools: currentProject.tools ?? "",
                      supplier: currentProject.supplier ?? "",
                      budget: currentProject.budget ?? "",
                      notes: currentProject.notes ?? "",
                    })
                    setWorkspaceError("")
                    setIsWorkspaceEditOpen(true)
                  }}
                  className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Edit Workspace
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Intention
                  </p>
                  <WorkspaceValue value={currentProject.intention} />
                </div>
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Idea
                  </p>
                  <WorkspaceValue value={currentProject.idea} />
                </div>
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Target Buyer
                  </p>
                  <WorkspaceValue value={currentProject.target_buyer} />
                </div>
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product
                  </p>
                  <WorkspaceValue value={currentProject.product} />
                </div>
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Price
                  </p>
                  <WorkspaceValue value={currentProject.price} />
                </div>
              </div>
            </section>

            <section id="operations" className={sectionCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Planning / Operations
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tools
                  </p>
                  <WorkspaceValue value={currentProject.tools} />
                </div>
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supplier
                  </p>
                  <WorkspaceValue value={currentProject.supplier} />
                </div>
                <div className={fieldCardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Budget
                  </p>
                  <WorkspaceValue value={currentProject.budget} />
                </div>
                <div className={`${fieldCardClassName} md:col-span-2`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </p>
                  <WorkspaceValue value={currentProject.notes} />
                </div>
              </div>
            </section>

            <section id="tasks" className={sectionCardClassName}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Tasks / Next Steps
                </p>

                {taskSaveState !== "idle" && (
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${getTaskSaveStateClassName(
                      taskSaveState
                    )}`}
                  >
                    {getTaskSaveStateLabel(taskSaveState)}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  ref={newTaskInputRef}
                  type="text"
                  value={newTaskText}
                  onChange={(event) => {
                    setNewTaskText(event.target.value)
                    if (taskInputError && event.target.value.trim()) {
                      setTaskInputError(false)
                    }
                  }}
                  onKeyDown={handleNewTaskKeyDown}
                  placeholder="Add a new task"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500 ${
                    taskInputError ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(event) => setNewTaskDueDate(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 sm:w-40"
                />
                <button
                  onClick={handleAddTask}
                  disabled={isSavingTask || !newTaskText.trim()}
                  className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add Task
                </button>
              </div>

              {taskError && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {taskError}
                </p>
              )}

              <div className="mt-6 space-y-3">
                {sortedTasks.length === 0 && (
                  <p className="text-sm text-slate-400">Not added yet</p>
                )}

                {sortedTasks.map((task) => {
                  const taskStatusBadge = getTaskStatusBadge(task)

                  return (
                    <div
                      key={task.id}
                      className={`flex flex-col gap-3 rounded-xl border border-slate-200 p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between ${
                        task.completed ? "bg-slate-50 opacity-80" : "bg-white opacity-100"
                      }`}
                    >
                      <label className="flex flex-1 items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          disabled={isSavingTasks}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <span
                          className={
                            task.completed
                              ? "text-slate-400 line-through transition-all duration-200"
                              : "text-slate-700 transition-all duration-200"
                          }
                        >
                          {task.text}
                        </span>
                      </label>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <input
                          type="date"
                          value={getTaskDueDateValue(task.due_date)}
                          onChange={(event) =>
                            handleUpdateTaskDueDate(task.id, event.target.value)
                          }
                          disabled={isSavingTasks}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${taskStatusBadge.className}`}
                        >
                          {taskStatusBadge.label}
                        </span>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={isSavingTasks}
                          className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  pendingDeletedTask
                    ? "mt-4 max-h-24 opacity-100"
                    : "mt-0 max-h-0 opacity-0"
                }`}
              >
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 [&>button]:hidden [&>span]:hidden">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      Deleted: {pendingDeletedTask?.text ?? ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleUndoDeleteTask}
                      className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
                    >
                      Undo
                    </button>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full origin-left rounded-full bg-indigo-500 transition-transform ease-linear"
                      style={{
                        transform: isUndoTimerRunning ? "scaleX(0)" : "scaleX(1)",
                        transitionDuration: `${taskDeleteUndoDurationMs}ms`,
                      }}
                    />
                  </div>
                  <span>Task deleted — Undo</span>
                  <button
                    type="button"
                    onClick={handleUndoDeleteTask}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Undo
                  </button>
                </div>
              </div>
            </section>

            <section id="timeline" className={sectionCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Timeline
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Timeline details can be organized here in a future pass.
              </p>
            </section>

            <section id="assets" className={sectionCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Assets
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Project assets can be organized here in a future pass.
              </p>
            </section>
          </div>
          </div>

          <aside className={`${detailCardClassName} lg:sticky lg:top-6`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Project Context
            </p>

            <div className="mt-6 space-y-4">
              <div className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {getDerivedProjectStatus(currentProject)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Progress Bar
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {currentProject.progress}%
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-green-700 transition-all"
                    style={{ width: `${currentProject.progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Deadline Bar
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {deadlineStatus}
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${getDeadlineBarClass(
                      deadlineStatus
                    )}`}
                    style={{
                      width: `${getDeadlineFill(currentProject.due_date)}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {currentProject.due_date
                    ? `Due ${currentProject.due_date}`
                    : "No due date"}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDeadlineBadgeClass(
                      deadlineStatus
                    )}`}
                  >
                    {deadlineStatus}
                  </span>
                </p>
              </div>

              <div className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created At
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(currentProject.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Supplier
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {currentProject.supplier?.trim() || "Not added yet"}
                </p>
              </div>

              <div className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Budget
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {currentProject.budget?.trim() || "Not added yet"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Primary Actions
                </p>

                <button
                  onClick={() => {
                    setEditForm({
                      name: currentProject.name,
                      description: currentProject.description ?? "",
                      progress: String(currentProject.progress),
                      due_date: currentProject.due_date ?? "",
                      visibility: currentProject.visibility,
                    })
                    setSaveError("")
                    setSaveFieldErrors({})
                    setIsEditOpen(true)
                  }}
                  className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Edit Project
                </button>

                <button
                  onClick={() => {
                    setWorkspaceForm({
                      intention: currentProject.intention ?? "",
                      idea: currentProject.idea ?? "",
                      target_buyer: currentProject.target_buyer ?? "",
                      product: currentProject.product ?? "",
                      price: currentProject.price ?? "",
                      tools: currentProject.tools ?? "",
                      supplier: currentProject.supplier ?? "",
                      budget: currentProject.budget ?? "",
                      notes: currentProject.notes ?? "",
                    })
                    setWorkspaceError("")
                    setIsWorkspaceEditOpen(true)
                  }}
                  className="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit Workspace
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Secondary Action
                </p>

                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-400 opacity-70"
                >
                  Archive Project
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Destructive Action
                </p>

                <button
                  onClick={() => {
                    setDeleteError("")
                    setIsDeleteOpen(true)
                  }}
                  className="inline-flex w-full justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isEditOpen && (
        <ModalShell
          hasUnsavedChanges={hasEditProjectChanges}
          isDismissDisabled={isSaving}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeEditProjectModal}
        >
          {({ requestClose }) => (
            <>
            <h2 className="text-xl font-bold text-slate-900">Edit Project</h2>
            <p className="mt-1 text-sm text-slate-600">
              Update the project details below.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm({ ...editForm, name: e.target.value })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      name: undefined,
                    }))
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => {
                    setEditForm({ ...editForm, description: e.target.value })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      description: undefined,
                    }))
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.description && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Progress
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.progress}
                  onChange={(e) => {
                    setEditForm({
                      ...editForm,
                      progress: normalizeProgressInputValue(e.target.value),
                    })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      progress: undefined,
                    }))
                  }}
                  onBlur={() =>
                    setEditForm((current) => ({
                      ...current,
                      progress: normalizeProgressOnBlur(
                        current.progress,
                        currentProject.progress
                      ),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.progress && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.progress}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => {
                    setEditForm({ ...editForm, due_date: e.target.value })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      due_date: undefined,
                    }))
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.due_date && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.due_date}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Visibility
                </label>
                <select
                  value={editForm.visibility}
                  onChange={(e) => {
                    setEditForm({
                      ...editForm,
                      visibility: e.target.value as ProjectVisibility,
                    })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      visibility: undefined,
                    }))
                  }}
                  className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                {saveFieldErrors.visibility && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.visibility}
                  </p>
                )}
              </div>

              {saveError && (
                <p className="text-sm font-medium text-red-600">{saveError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSaving}
                className="inline-flex cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateProject}
                disabled={isSaving || !editForm.name.trim()}
                className="inline-flex cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
            </>
          )}
        </ModalShell>
      )}

      {isWorkspaceEditOpen && (
        <ModalShell
          hasUnsavedChanges={hasWorkspaceChanges}
          isDismissDisabled={isSavingWorkspace}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          panelClassName="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeWorkspaceEditModal}
        >
          {({ requestClose }) => (
            <>
            <h2 className="text-xl font-bold text-slate-900">
              Edit Workspace
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Capture the project idea, buyer, tools, and operating notes.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {(
                [
                  ["intention", "Intention"],
                  ["idea", "Idea"],
                  ["target_buyer", "Target Buyer"],
                  ["product", "Product"],
                  ["price", "Price"],
                  ["tools", "Tools"],
                  ["supplier", "Supplier"],
                  ["budget", "Budget"],
                  ["notes", "Notes"],
                ] as Array<[keyof ProjectWorkspaceForm, string]>
              ).map(([field, label]) => (
                <div
                  key={field}
                  className={field === "notes" ? "md:col-span-2" : ""}
                >
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {label}
                  </label>
                  <textarea
                    rows={field === "notes" || field === "idea" ? 4 : 2}
                    value={workspaceForm[field]}
                    onChange={(event) =>
                      setWorkspaceForm((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>

            {workspaceError && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {workspaceError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSavingWorkspace}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateWorkspace}
                disabled={isSavingWorkspace}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingWorkspace ? "Saving..." : "Save Workspace"}
              </button>
            </div>
            </>
          )}
        </ModalShell>
      )}

      {isAddModuleOpen && (
        <ModalShell
          hasUnsavedChanges={hasCreateModuleChanges}
          isDismissDisabled={isCreatingModule}
          panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeAddModuleModal}
        >
          {({ requestClose }) => (
            <>
              <h2 className="text-xl font-bold text-slate-900">Add Module</h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a new workspace module in the center column.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Module Title
                  </label>
                  <input
                    type="text"
                    value={createModuleForm.title}
                    onChange={(event) => {
                      setCreateModuleForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                      if (moduleError && event.target.value.trim()) {
                        setModuleError("")
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Module Type
                  </label>
                  <select
                    value={createModuleForm.type}
                    onChange={(event) =>
                      setCreateModuleForm((current) => ({
                        ...current,
                        type: event.target.value as ProjectModuleType,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {customProjectModuleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {moduleError && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {moduleError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isCreatingModule}
                  className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateWorkspaceModule}
                  disabled={isCreatingModule || !createModuleForm.title.trim()}
                  className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {isCreatingModule ? "Creating..." : "Create Module"}
                </button>
              </div>
            </>
          )}
        </ModalShell>
      )}

      {isDeleteOpen && (
        <ModalShell
          isDismissDisabled={isDeleting}
          panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          onClose={closeDeleteProjectModal}
        >
          {({ requestClose }) => (
            <>
            <h3 className="text-lg font-semibold text-slate-900">
              Delete Project
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {currentProject.name}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={requestClose}
                disabled={isDeleting}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                disabled={isDeleting}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
            </>
          )}
        </ModalShell>
      )}
    </>
  )
}
