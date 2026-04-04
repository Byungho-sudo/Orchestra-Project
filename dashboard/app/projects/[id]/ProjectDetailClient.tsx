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
import type { Project } from "@/lib/projects"
import {
  validateProjectForm,
  type ProjectFormErrors,
} from "@/lib/project-validation"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/use-current-user"

export default function ProjectDetailClient({
  project,
}: {
  project: Project
}) {
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveFieldErrors, setSaveFieldErrors] = useState<ProjectFormErrors>({})
  const [deleteError, setDeleteError] = useState("")

  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description ?? "",
    progress: project.progress,
    due_date: project.due_date ?? "",
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
        visibility: project.visibility,
      },
      project.visibility === "private" || Boolean(currentUser)
    )

    setSaveFieldErrors(validation.errors)

    if (!validation.isValid) return

    setIsSaving(true)

    const { error } = await supabase
      .from("projects")
      .update({
        name: validation.values.name,
        description: validation.values.description,
        progress: validation.values.progress ?? project.progress,
        due_date: validation.values.due_date,
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
    if (isDeleting) return

    setDeleteError("")
    setIsDeleting(true)

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id)

    setIsDeleting(false)

    if (error) {
      setDeleteError("Failed to delete project. Please try again.")
      return
    }

    setIsDeleteOpen(false)
    router.push("/")
  }

  const deadlineStatus = getDeadlineStatus(project.due_date)

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
                    {deadlineStatus}
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${getDeadlineBarClass(
                      deadlineStatus
                    )}`}
                    style={{ width: `${getDeadlineFill(project.due_date)}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {project.due_date ? `Due ${project.due_date}` : "No due date"}
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
                  setSaveFieldErrors({})
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
