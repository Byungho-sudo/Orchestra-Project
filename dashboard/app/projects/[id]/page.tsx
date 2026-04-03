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

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Return to dashboard
              </Link>
            </div>
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

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Return to dashboard
              </Link>
            </div>
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
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Deadline Indicator
                </span>
                <span className="text-sm font-medium text-slate-600">
                  Placeholder
                </span>
              </div>

              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all"
                  style={{ width: "5%" }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                This section is ready for future deadline calculation logic.
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
              disabled
              className="inline-flex cursor-not-allowed rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white opacity-60"
            >
              Edit from detail page (next step)
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}