"use client"

import { useEffect, useMemo, useState } from "react"
import { getDeadlineStatus } from "@/lib/project-deadline"
import type { Project } from "@/lib/projects"
import { supabase } from "@/lib/supabase"
import {
  isProjectTimelineEventsSchemaMissingError,
  logSupabaseMutationResult,
} from "../helpers"
import type { ProjectTimelineEventRecord } from "./useTimelineEvents"

type ProjectTaskSummaryRow = {
  id: number
  completed: boolean
  due_date: string | null
}

function getIsOverdueTask(task: ProjectTaskSummaryRow) {
  if (task.completed || !task.due_date) return false

  const [year, month, day] = task.due_date.split("-").map(Number)
  const taskDueAt = Date.UTC(year, month - 1, day)
  const today = new Date()
  const todayAt = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  return taskDueAt < todayAt
}

export function useProjectHealthSummary({ project }: { project: Project }) {
  const [taskRows, setTaskRows] = useState<ProjectTaskSummaryRow[]>([])
  const [timelineRows, setTimelineRows] = useState<ProjectTimelineEventRecord[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadProjectHealthSummary() {
      setIsLoading(true)
      setError("")

      const [tasksResult, timelineResult] = await Promise.all([
        supabase
          .from("project_tasks")
          .select("id,completed,due_date")
          .eq("project_id", project.id),
        supabase
          .from("project_timeline_events")
          .select("id,status,project_id,module_id,name,start_date,end_date,description,order,created_at,updated_at")
          .eq("project_id", project.id),
      ])

      logSupabaseMutationResult("Project health tasks fetch", {
        data: tasksResult.data,
        error: tasksResult.error,
        status: tasksResult.status,
        statusText: tasksResult.statusText,
      })

      logSupabaseMutationResult("Project health timeline fetch", {
        data: timelineResult.data,
        error: timelineResult.error,
        status: timelineResult.status,
        statusText: timelineResult.statusText,
      })

      if (!isMounted) return

      if (tasksResult.error) {
        setError("Failed to load project health summary. Please refresh and try again.")
        setIsLoading(false)
        return
      }

      if (
        timelineResult.error &&
        !isProjectTimelineEventsSchemaMissingError(timelineResult.error)
      ) {
        setError("Failed to load project health summary. Please refresh and try again.")
        setIsLoading(false)
        return
      }

      setTaskRows((tasksResult.data as ProjectTaskSummaryRow[]) || [])
      setTimelineRows(
        timelineResult.error
          ? []
          : ((timelineResult.data as ProjectTimelineEventRecord[]) || [])
      )
      setIsLoading(false)
    }

    void loadProjectHealthSummary()

    return () => {
      isMounted = false
    }
  }, [project.id])

  const summary = useMemo(() => {
    const totalTaskCount = taskRows.length
    const completedTaskCount = taskRows.filter((task) => task.completed).length
    const overdueTaskCount = taskRows.filter(getIsOverdueTask).length
    const totalMilestoneCount = timelineRows.length
    const completedMilestoneCount = timelineRows.filter(
      (event) => event.status === "completed"
    ).length
    const blockedMilestoneCount = timelineRows.filter(
      (event) => event.status === "blocked"
    ).length

    return {
      blockedMilestoneCount,
      completedMilestoneCount,
      completedTaskCount,
      deadlineStatus: getDeadlineStatus(project.due_date),
      health: project.health,
      overdueTaskCount,
      progress: project.progress,
      status: project.status,
      totalMilestoneCount,
      totalTaskCount,
    }
  }, [
    project.due_date,
    project.health,
    project.progress,
    project.status,
    taskRows,
    timelineRows,
  ])

  return {
    error,
    isLoading,
    summary,
  }
}
