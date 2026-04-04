"use client"

import { useState } from "react"
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

function getTaskId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function WorkspaceValue({ value }: { value: string | null }) {
  return (
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
      {value?.trim() || <span className="text-slate-400">Not added yet</span>}
    </p>
  )
}

export default function ProjectDetailClient({
  project,
}: {
  project: Project
}) {
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()

  const [currentProject, setCurrentProject] = useState<Project>({
    ...project,
    tasks: project.tasks ?? [],
  })

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

    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", currentProject.id)

    setIsSavingWorkspace(false)

    if (error) {
      setWorkspaceError("Failed to save workspace. Please try again.")
      return
    }

    setCurrentProject((current) => ({ ...current, ...updates }))
    setIsWorkspaceEditOpen(false)
    router.refresh()
  }

  async function saveTasks(nextTasks: ProjectTask[]) {
    if (isSavingTasks) return false

    setTaskError("")
    setIsSavingTasks(true)

    const { error } = await supabase
      .from("projects")
      .update({ tasks: nextTasks })
      .eq("id", currentProject.id)

    setIsSavingTasks(false)

    if (error) {
      setTaskError("Failed to update tasks. Please try again.")
      return false
    }

    setCurrentProject((current) => ({ ...current, tasks: nextTasks }))
    router.refresh()
    return true
  }

  async function handleAddTask() {
    const taskText = newTaskText.trim()

    if (!taskText) return

    const didSave = await saveTasks([
      ...(currentProject.tasks ?? []),
      { id: getTaskId(), text: taskText, completed: false },
    ])

    if (didSave) {
      setNewTaskText("")
    }
  }

  async function handleToggleTask(taskId: string) {
    await saveTasks(
      (currentProject.tasks ?? []).map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  async function handleDeleteTask(taskId: string) {
    await saveTasks(
      (currentProject.tasks ?? []).filter((task) => task.id !== taskId)
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

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-6 py-10">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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

              <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {currentProject.id}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due Date
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {currentProject.due_date ?? "No due date"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Progress
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {currentProject.progress}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created At
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(currentProject.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-slate-200 p-5">
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

              <div className="rounded-xl border border-slate-200 p-5">
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

          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Intention
                  </p>
                  <WorkspaceValue value={currentProject.intention} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Idea
                  </p>
                  <WorkspaceValue value={currentProject.idea} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Target Buyer
                  </p>
                  <WorkspaceValue value={currentProject.target_buyer} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product
                  </p>
                  <WorkspaceValue value={currentProject.product} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Price
                  </p>
                  <WorkspaceValue value={currentProject.price} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Planning / Operations
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tools
                  </p>
                  <WorkspaceValue value={currentProject.tools} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supplier
                  </p>
                  <WorkspaceValue value={currentProject.supplier} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Budget
                  </p>
                  <WorkspaceValue value={currentProject.budget} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </p>
                  <WorkspaceValue value={currentProject.notes} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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
                {(currentProject.tasks ?? []).length === 0 && (
                  <p className="text-sm text-slate-400">Not added yet</p>
                )}

                {(currentProject.tasks ?? []).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
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

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={isSavingTasks}
                      className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
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
