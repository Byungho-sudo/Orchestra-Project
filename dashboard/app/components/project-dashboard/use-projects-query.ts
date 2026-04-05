"use client"

import { useEffect, useState } from "react"
import type { DeadlineFilter } from "@/lib/project-deadline"
import {
  filterProjects,
  sortProjects,
  type Project,
  type SortOption,
} from "@/lib/projects"
import { supabase } from "@/lib/supabase"

type UseProjectsQueryResult = {
  errorMessage: string
  loading: boolean
  projects: Project[]
  searchQuery: string
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  sortedProjects: Project[]
  sortBy: SortOption
  setSortBy: React.Dispatch<React.SetStateAction<SortOption>>
  deadlineFilter: DeadlineFilter
  setDeadlineFilter: React.Dispatch<React.SetStateAction<DeadlineFilter>>
}

export function useProjectsQuery(): UseProjectsQueryResult {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "due_date"

    return (localStorage.getItem("sortBy") as SortOption) || "due_date"
  })

  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>(() => {
    if (typeof window === "undefined") return "All"

    return (localStorage.getItem("deadlineFilter") as DeadlineFilter) || "All"
  })

  const filteredProjects = filterProjects(
    projects,
    searchQuery,
    deadlineFilter
  )
  const sortedProjects = sortProjects(filteredProjects, sortBy)

  useEffect(() => {
    const fetchProjects = async () => {
      setErrorMessage("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const query = supabase.from("projects").select("*")
      const { data, error } = user
        ? await query
            .or(`visibility.eq.public,user_id.eq.${user.id}`)
            .order("due_date", { ascending: true })
        : await query
            .eq("visibility", "public")
            .order("due_date", { ascending: true })

      if (error) {
        console.error("Supabase error:", error)
        console.error("message:", error?.message)
        console.error("details:", error?.details)
        console.error("hint:", error?.hint)
        setErrorMessage("Failed to load projects. Please try again.")
      } else {
        setProjects(data || [])
      }

      setLoading(false)
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    localStorage.setItem("deadlineFilter", deadlineFilter)
  }, [deadlineFilter])

  useEffect(() => {
    localStorage.setItem("sortBy", sortBy)
  }, [sortBy])

  return {
    errorMessage,
    loading,
    projects,
    searchQuery,
    setErrorMessage,
    setProjects,
    setSearchQuery,
    sortedProjects,
    sortBy,
    setSortBy,
    deadlineFilter,
    setDeadlineFilter,
  }
}
