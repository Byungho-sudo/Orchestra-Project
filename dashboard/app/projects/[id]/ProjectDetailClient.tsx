"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type Project = {
  id: number
  name: string
  description: string | null
  progress: number
  due_date: string | null
  created_at: string
  owner_id: string | null
  is_public: boolean
}

export default function ProjectDetailClient({
  project,
}: {
  project: Project
}) {
  const router = useRouter()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description ?? "",
    progress: project.progress,
    due_date: project.due_date ?? "",
  })

  useEffect(() => {
    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setCurrentUser(user)
    }

    loadCurrentUser()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  async function handleUpdateProject() {
    if (
      !editForm.name.trim() ||
      !editForm.description.trim() ||
      !editForm.due_date.trim()
    ) {
      return
    }

    setIsSaving(true)
    setSaveError("")

    const progressValue = Math.max(0, Math.min(100, Number(editForm.progress)))

    const { error } = await supabase
      .from("projects")
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        progress: progressValue,
        due_date: editForm.due_date,
      })
      .eq("id", project.id)

    setIsSaving(false)

    if (error) {
      setSaveError("Failed to update project. Please try again.")
      return
    }

    setIsEditOpen(false)
    router.refresh()
  }

  async function confirmDeleteProject() {
    setDeleteError("")

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id)

    if (error) {
      setDeleteError("Failed to delete project. Please try again.")
      return
    }

    setIsDeleteOpen(false)
    router.push("/")
  }

  async function logout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    router.push("/login")
  }

  function getDeadlineStatus(dueDate: string | null) {
    if (!dueDate) return "No deadline"

    const [year, month, day] = dueDate.split("-").map(Number)
    const dueAt = Date.UTC(year, month - 1, day)
    const today = new Date()
    const todayAt = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )

    const daysUntilDue = Math.round(
      (dueAt - todayAt) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDue < 0) return "Overdue"
    if (daysUntilDue === 0) return "Due today"
    if (daysUntilDue <= 7) return "Due soon"
    return `Due in ${daysUntilDue} days`
  }

  function getDeadlineFill(dueDate: string | null) {
    if (!dueDate) return 0

    const [year, month, day] = dueDate.split("-").map(Number)
    const dueAt = Date.UTC(year, month - 1, day)
    const today = new Date()
    const todayAt = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    const daysUntilDue = Math.round(
      (dueAt - todayAt) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDue <= 0) return 100
    if (daysUntilDue <= 3) return 90
    if (daysUntilDue <= 7) return 75
    if (daysUntilDue <= 14) return 45
    if (daysUntilDue <= 30) return 20
    return 5
  }

  function getDeadlineBarClass(status: string) {
    if (status === "Overdue") return "bg-red-700"
    if (status === "Due today") return "bg-orange-600"
    if (status === "Due soon") return "bg-amber-500"
    if (status === "No deadline") return "bg-gray-400"
    return "bg-blue-700"
  }

  function getDeadlineBadgeClass(status: string) {
    if (status === "Overdue") return "bg-red-100 text-red-700"
    if (status === "Due today") return "bg-orange-100 text-orange-700"
    if (status === "Due soon") return "bg-yellow-100 text-yellow-800"
    if (status === "No deadline") return "bg-slate-100 text-slate-600"
    return "bg-blue-100 text-blue-700"
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              ← Back to dashboard
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
                  {project.name}
                </h1>

                <p className="mt-4 text-base leading-7 text-slate-600">
                  {project.description?.trim() || "No description provided."}
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {project.id}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due Date
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {project.due_date ?? "No due date"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Progress
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {project.progress}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created At
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(project.created_at).toLocaleDateString()}
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
                    {project.progress}%
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-green-700 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Deadline Bar
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {getDeadlineStatus(project.due_date)}
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${getDeadlineBarClass(
                      getDeadlineStatus(project.due_date)
                    )}`}
                    style={{ width: `${getDeadlineFill(project.due_date)}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {project.due_date ? `Due ${project.due_date}` : "No due date"}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDeadlineBadgeClass(
                      getDeadlineStatus(project.due_date)
                    )}`}
                  >
                    {getDeadlineStatus(project.due_date)}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to dashboard
              </Link>

              <button
                onClick={() => {
                  setEditForm({
                    name: project.name,
                    description: project.description ?? "",
                    progress: project.progress,
                    due_date: project.due_date ?? "",
                  })
                  setSaveError("")
                  setIsEditOpen(true)
                }}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Edit from detail page
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
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
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
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      progress: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, due_date: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              {saveError && (
                <p className="text-sm font-medium text-red-600">{saveError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditOpen(false)
                  setSaveError("")
                }}
                disabled={isSaving}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateProject}
                disabled={
                  isSaving ||
                  !editForm.name.trim() ||
                  !editForm.description.trim() ||
                  !editForm.due_date.trim()
                }
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
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
                {project.name}
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
                  setIsDeleteOpen(false)
                  setDeleteError("")
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
