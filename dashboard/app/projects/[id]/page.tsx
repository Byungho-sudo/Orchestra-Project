import Link from "next/link"
import { supabase } from "@/lib/supabase"
import ProjectDetailClient from "./ProjectDetailClient"

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
    console.error("Error fetching project:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      errorJson: JSON.stringify(error),
    })

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

  return <ProjectDetailClient project={project} />
}
