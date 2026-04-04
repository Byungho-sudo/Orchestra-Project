"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppShell } from "@/app/components/project-dashboard/AppShell"
import { ProjectCard } from "@/app/components/project-dashboard/ProjectCard"
import { sortProjects, type Project } from "@/lib/projects"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/use-current-user"

export default function DashboardOverviewPage() {
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

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
            .limit(3)
        : await query
            .eq("visibility", "public")
            .order("created_at", { ascending: false })
            .limit(3)

      if (error) {
        console.error("Supabase error:", error)
        setErrorMessage("Failed to load recent projects. Please try again.")
      } else {
        setProjects(sortProjects(data || [], "created_at"))
      }

      setLoading(false)
    }

    fetchRecentProjects()
  }, [])

  return (
    <AppShell title="Dashboard Overview" currentUser={currentUser} onLogout={logout}>
      <main className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent Projects
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {projects.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Session
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {currentUser?.email ?? "Browsing public projects"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Project Workspace
            </p>
            <Link
              href="/projects"
              className="mt-3 inline-flex text-sm font-medium text-indigo-600 hover:underline"
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

          {!loading && !errorMessage && projects.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                No recent projects
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Open the Projects page to create your first project.
              </p>
            </div>
          )}

          {!loading && !errorMessage && projects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
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
