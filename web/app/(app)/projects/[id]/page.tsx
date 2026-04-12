import Link from "next/link"
import { AppLayout } from "@/components/layout/AppLayout"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  mergeProjectWithProgress,
  type Project,
  type ProjectProgressRow,
  type ProjectRow,
} from "@/lib/projects"
import ProjectDetailClient from "./ProjectDetailClient"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", Number(id))
    .single()

  if (error) {
    console.error("Error fetching project:", error)

    return (
      <AppLayout title="Project">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/projects"
            className="mb-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Back to projects
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
                href="/projects"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Return to projects
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!project) {
    return (
      <AppLayout title="Project">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/projects"
            className="mb-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Back to projects
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
                href="/projects"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Return to projects
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const { data: projectProgress } = await supabase
    .from("project_progress")
    .select("*")
    .eq("project_id", Number(id))
    .maybeSingle()

  return (
    <ProjectDetailClient
      project={mergeProjectWithProgress(
        project as ProjectRow,
        (projectProgress as ProjectProgressRow | null) ?? null
      ) as Project}
    />
  )
}
