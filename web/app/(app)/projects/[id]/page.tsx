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
            className="mb-6 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Back to projects
          </Link>

          <div className="rounded-2xl border border-[var(--color-status-danger-border)] bg-[var(--theme-card)] p-8 shadow-[var(--color-card-shadow)]">
            <h1 className="text-2xl font-bold text-[var(--color-status-danger)]">
              Failed to load project
            </h1>
            <p className="mt-2 text-sm text-[var(--color-card-muted-foreground)]">
              Something went wrong while fetching this project from the database.
            </p>

            <div className="mt-6">
              <Link
                href="/projects"
                className="inline-flex rounded-lg bg-[var(--theme-primary)] px-4 py-2 text-sm font-medium text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary-hover)]"
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
            className="mb-6 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Back to projects
          </Link>

          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--theme-card)] p-8 shadow-[var(--color-card-shadow)]">
            <h1 className="text-2xl font-bold text-[var(--theme-card-foreground)]">
              Project not found
            </h1>
            <p className="mt-2 text-sm text-[var(--color-card-muted-foreground)]">
              This project does not exist or may have been deleted.
            </p>

            <div className="mt-6">
              <Link
                href="/projects"
                className="inline-flex rounded-lg bg-[var(--theme-primary)] px-4 py-2 text-sm font-medium text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary-hover)]"
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
