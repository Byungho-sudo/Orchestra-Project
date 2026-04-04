"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getDeadlineBadgeClass,
  getDeadlineBarClass,
  getDeadlineFill,
  getDeadlineStatus,
} from "@/lib/project-deadline"
import type { Project, ProjectTask } from "@/lib/projects"
import {
  validateProjectForm,
  type ProjectFormErrors,
} from "@/lib/project-validation"
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

const detailCardClassName =
  "rounded-xl border border-slate-300 bg-slate-50 p-8 shadow-sm"
const sectionCardClassName =
  "rounded-xl border border-slate-300 bg-slate-50 p-8 shadow-sm"
const fieldCardClassName =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]"

function getTaskDueDateValue(dueDate: string | null) {
  return dueDate ? dueDate.slice(0, 10) : ""
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

function WorkspaceValue({ value }: { value: string | null }) {
  return (
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
      {value?.trim() || <span className="text-slate-400">Not added yet</span>}
    </p>
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

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isWorkspaceEditOpen, setIsWorkspaceEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [isSavingTasks, setIsSavingTasks] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [workspaceError, setWorkspaceError] = useState("")
  const [taskError, setTaskError] = useState("")
  const [saveFieldErrors, setSaveFieldErrors] = useState<ProjectFormErrors>({})
  const [deleteError, setDeleteError] = useState("")
  const [newTaskText, setNewTaskText] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")

  const [editForm, setEditForm] = useState({
    name: currentProject.name,
    description: currentProject.description ?? "",
    progress: currentProject.progress,
    due_date: currentProject.due_date ?? "",
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

  async function handleUpdateProject() {
    if (isSaving) return

    setSaveError("")

    const validation = validateProjectForm(
      {
        name: editForm.name,
        description: editForm.description,
        due_date: editForm.due_date,
        progress: editForm.progress,
        visibility: currentProject.visibility,
      },
      currentProject.visibility === "private" || Boolean(currentUser)
    )

    setSaveFieldErrors(validation.errors)

    if (!validation.isValid) return

    setIsSaving(true)

    const updates = {
      name: validation.values.name,
      description: validation.values.description,
      progress: validation.values.progress ?? currentProject.progress,
      due_date: validation.values.due_date,
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
    if (isSavingTasks) return

    const taskText = newTaskText.trim()

    if (!taskText) return

    setTaskError("")
    setIsSavingTasks(true)

    try {
      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .insert([
          {
            project_id: currentProject.id,
            text: taskText,
            completed: false,
            due_date: newTaskDueDate || null,
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

      setTasks((current) => [...current, data as ProjectTask])
      setNewTaskText("")
      setNewTaskDueDate("")
      router.refresh()
      return true
    } catch (error) {
      console.error("Task update failed:", error)
      console.error("Task update failed JSON:", JSON.stringify(error, null, 2))
      setTaskError("Failed to update tasks. Please try again.")
      return false
    } finally {
      setIsSavingTasks(false)
    }
  }

  async function handleUpdateTaskDueDate(taskId: number, dueDate: string) {
    if (isSavingTasks) return

    setTaskError("")
    setIsSavingTasks(true)

    try {
      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .update({ due_date: dueDate || null })
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
      router.refresh()
    } catch (error) {
      console.error("Task due date update failed:", error)
      console.error(
        "Task due date update failed JSON:",
        JSON.stringify(error, null, 2)
      )
      setTaskError("Failed to update task due date. Please try again.")
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

    try {
      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .update({ completed: !taskToUpdate.completed })
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
      router.refresh()
    } catch (error) {
      console.error("Task update failed:", error)
      console.error("Task update failed JSON:", JSON.stringify(error, null, 2))
      setTaskError("Failed to update tasks. Please try again.")
    } finally {
      setIsSavingTasks(false)
    }
  }

  async function handleDeleteTask(taskId: number) {
    if (isSavingTasks) return

    setTaskError("")
    setIsSavingTasks(true)

    try {
      console.log("Updating projectId:", currentProject.id)

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", taskId)
        .eq("project_id", currentProject.id)
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

      setTasks((current) => current.filter((task) => task.id !== taskId))
      router.refresh()
    } catch (error) {
      console.error("Task delete failed:", error)
      console.error("Task delete failed JSON:", JSON.stringify(error, null, 2))
      setTaskError("Failed to delete task. Please try again.")
    } finally {
      setIsSavingTasks(false)
    }
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

  return (
    <>
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Back to projects
            </Link>

            {currentUser ? (
              <button
                onClick={logout}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:underline"
              >
                Log in
              </Link>
            )}
          </div>

          <div className={detailCardClassName}>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
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

            <div className="mt-8 grid gap-4 md:grid-cols-3">
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

            <div className="mt-8 space-y-6">
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

            <div className="mt-8 flex flex-wrap gap-3">
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
                    progress: currentProject.progress,
                    due_date: currentProject.due_date ?? "",
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
            <section className={sectionCardClassName}>
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
                  className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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

            <section className={sectionCardClassName}>
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

            <section className={sectionCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tasks / Next Steps
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(event) => setNewTaskText(event.target.value)}
                  placeholder="Add a new task"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(event) => setNewTaskDueDate(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 sm:w-40"
                />
                <button
                  onClick={handleAddTask}
                  disabled={isSavingTasks || !newTaskText.trim()}
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
                {tasks.length === 0 && (
                  <p className="text-sm text-slate-400">Not added yet</p>
                )}

                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between"
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
                            ? "text-slate-400 line-through"
                            : "text-slate-700"
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

                      {getTaskDueBadge(task) && (
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getTaskDueBadge(task)?.className}`}
                        >
                          {getTaskDueBadge(task)?.label}
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isSavingTasks}
                        className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
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
                      progress: Number(e.target.value),
                    })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      progress: undefined,
                    }))
                  }}
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

              {saveError && (
                <p className="text-sm font-medium text-red-600">{saveError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (isSaving) return

                  setIsEditOpen(false)
                  setSaveError("")
                  setSaveFieldErrors({})
                }}
                disabled={isSaving}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateProject}
                disabled={isSaving || !editForm.name.trim()}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isWorkspaceEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
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
                onClick={() => {
                  if (isSavingWorkspace) return

                  setIsWorkspaceEditOpen(false)
                  setWorkspaceError("")
                }}
                disabled={isSavingWorkspace}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateWorkspace}
                disabled={isSavingWorkspace}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingWorkspace ? "Saving..." : "Save Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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
                onClick={() => {
                  if (isDeleting) return

                  setIsDeleteOpen(false)
                  setDeleteError("")
                }}
                disabled={isDeleting}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={isDeleting}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
