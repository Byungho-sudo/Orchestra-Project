"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppShell } from "@/app/components/project-dashboard/AppShell"
import { ProjectCard } from "@/app/components/project-dashboard/ProjectCard"
import { getDeadlineStatus } from "@/lib/project-deadline"
import { sortProjects, type Project } from "@/lib/projects"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/use-current-user"

export default function DashboardOverviewPage() {
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const totalProjects = projects.length
  const completedProjects = projects.filter(
    (project) => project.progress >= 100
  ).length
  const activeProjects = projects.filter(
    (project) => project.progress < 100
  ).length
  const overdueProjects = projects.filter(
    (project) =>
      project.progress < 100 &&
      getDeadlineStatus(project.due_date) === "Overdue"
  ).length
  const recentProjects = sortProjects(projects, "created_at").slice(0, 3)

  useEffect(() => {
    const fetchRecentProjects = async () => {
      setErrorMessage("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const query = supabase.from("projects").select("*")
      const { data, error } = user
        ? await query
            .or(`visibility.eq.public,user_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
        : await query
            .eq("visibility", "public")
            .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        setErrorMessage("Failed to load recent projects. Please try again.")
      } else {
        setProjects(data || [])
      }

      setLoading(false)
    }

    fetchRecentProjects()
  }, [])

  return (
    <AppShell title="Dashboard Overview" currentUser={currentUser} onLogout={logout}>
      <main className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Projects
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {totalProjects}
            </p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Projects
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {activeProjects}
            </p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overdue Projects
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {overdueProjects}
            </p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completed Projects
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {completedProjects}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Session
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {currentUser?.email ?? "Browsing public projects"}
              </p>
            </div>

            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Open Projects
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {loading && <div className="p-6">Loading overview...</div>}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {!loading && !errorMessage && recentProjects.length === 0 && (
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                No recent projects
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Open the Projects page to create your first project.
              </p>
            </div>
          )}

          {!loading && !errorMessage && recentProjects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenProject={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
