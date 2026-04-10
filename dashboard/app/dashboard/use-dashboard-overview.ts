"use client"

import { useEffect, useMemo, useState } from "react"
import { getDeadlineStatus } from "@/lib/project-deadline"
import { sortProjects, type Project } from "@/lib/projects"
import { supabase } from "@/lib/supabase"

export function useDashboardOverview() {
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

  return useMemo(() => {
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

    return {
      activeProjects,
      completedProjects,
      errorMessage,
      loading,
      overdueProjects,
      recentProjects,
      totalProjects,
    }
  }, [errorMessage, loading, projects])
}
