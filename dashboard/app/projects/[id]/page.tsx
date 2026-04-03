import Link from "next/link"
import { supabase } from "@/lib/supabase"

type Project = {
  id: number
  name: string
  description: string | null
  progress: number
  due_date: string | null
  created_at: string
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>()

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to dashboard
          </Link>

          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-red-600">
              Failed to load project
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Something went wrong while fetching this project from the database.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to dashboard
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Project not found
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              This project does not exist or may have been deleted.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            {project.description?.trim() || "No description provided."}
          </p>

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

          <div className="mt-8 rounded-xl border border-slate-200 p-5">
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
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}