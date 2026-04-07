"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { useRouter } from "next/navigation"
import type { ProjectTask } from "@/lib/projects"
import { supabase } from "@/lib/supabase"
import {
  filterTasksByView,
  getTaskCounts,
  getTaskDueDateValue,
  getTaskPriorityBadge,
  getTaskSaveStateClassName,
  getTaskSaveStateLabel,
  getTaskStatusBadge,
  getTaskWorkflowStatusBadge,
  isTaskOverdue,
  logSupabaseMutationResult,
  normalizeTaskDueDateInput,
  sortTasksByUrgency,
  taskDeleteUndoDurationMs,
} from "../helpers"
import type {
  ProjectModuleTaskUiProps,
  TaskFilterOption,
  TaskSaveState,
} from "../types"

const emptyTaskUi: ProjectModuleTaskUiProps = {
  getTaskDueDateValue,
  getTaskPriorityBadge,
  getTaskSaveStateClassName,
  getTaskSaveStateLabel,
  getTaskStatusBadge,
  handleAddTask: () => {},
  handleDeleteTask: () => {},
  handleNewTaskKeyDown: () => {},
  handleUpdateTaskPriority: () => {},
  handleUpdateTaskStatus: () => {},
  handleToggleTask: () => {},
  handleUndoDeleteTask: () => {},
  handleUpdateTaskDueDate: () => {},
  isTaskOverdue,
  isSavingTask: false,
  isSavingTasks: false,
  isUndoTimerRunning: false,
  newTaskDueDate: "",
  newTaskInputRef: { current: null },
  newTaskPriority: "medium",
  newTaskStatus: "not_started",
  newTaskText: "",
  pendingDeletedTask: null,
  selectedTaskFilter: "all",
  setNewTaskPriority: () => "medium",
  setNewTaskStatus: () => "not_started",
  setNewTaskDueDate: () => "",
  setNewTaskText: () => "",
  setSelectedTaskFilter: () => "all",
  setTaskInputError: () => false,
  taskCounts: {
    completed: 0,
    overdue: 0,
    total: 0,
    upcoming: 0,
  },
  sortedTasks: [],
  taskError: "",
  taskInputError: false,
  taskSaveState: "idle",
}

export function useProjectTasks({
  enabled,
  moduleId,
  projectId,
}: {
  enabled: boolean
  moduleId: string
  projectId: number
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [taskError, setTaskError] = useState("")
  const [taskSaveState, setTaskSaveState] = useState<TaskSaveState>("idle")
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [isSavingTasks, setIsSavingTasks] = useState(false)
  const [newTaskText, setNewTaskText] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [newTaskStatus, setNewTaskStatus] = useState<
    "not_started" | "in_progress" | "completed" | "blocked"
  >("not_started")
  const [selectedTaskFilter, setSelectedTaskFilter] =
    useState<TaskFilterOption>("all")
  const [taskInputError, setTaskInputError] = useState(false)
  const [pendingDeletedTask, setPendingDeletedTask] =
    useState<ProjectTask | null>(null)
  const [isUndoTimerRunning, setIsUndoTimerRunning] = useState(false)

  const newTaskInputRef = useRef<HTMLInputElement | null>(null)
  const taskSaveResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const taskDeleteUndoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const pendingDeletedTaskRef = useRef<ProjectTask | null>(null)

  const updateTaskSaveState = useCallback((nextState: TaskSaveState) => {
    if (taskSaveResetTimeoutRef.current) {
      clearTimeout(taskSaveResetTimeoutRef.current)
      taskSaveResetTimeoutRef.current = null
    }

    setTaskSaveState(nextState)

    if (nextState === "saved") {
      taskSaveResetTimeoutRef.current = setTimeout(() => {
        setTaskSaveState("idle")
        taskSaveResetTimeoutRef.current = null
      }, 1600)
    }
  }, [])

  const clearPendingTaskDeleteTimeout = useCallback(() => {
    if (taskDeleteUndoTimeoutRef.current) {
      clearTimeout(taskDeleteUndoTimeoutRef.current)
      taskDeleteUndoTimeoutRef.current = null
    }
  }, [])

  const commitTaskDelete = useCallback(
    async (taskToDelete: ProjectTask) => {
      if (!enabled) return

      setTaskError("")
      updateTaskSaveState("saving")

      try {
        console.log("Updating projectId/moduleId:", { projectId, moduleId })

        const { data, error, status, statusText } = await supabase
          .from("project_tasks")
          .delete()
          .eq("id", taskToDelete.id)
          .eq("project_id", taskToDelete.project_id)
          .eq("module_id", moduleId)
          .select("id")
          .single()

        logSupabaseMutationResult("Task delete", {
          data,
          error,
          status,
          statusText,
        })

        if (error) {
          throw error
        }

        updateTaskSaveState("saved")
        router.refresh()
      } catch (error) {
        console.error("Task delete failed:", error)
        console.error("Task delete failed JSON:", JSON.stringify(error, null, 2))
        setTasks((current) =>
          current.some((task) => task.id === taskToDelete.id)
            ? current
            : [...current, taskToDelete]
        )
        setTaskError("Failed to delete task. Please try again.")
        updateTaskSaveState("error")
      }
    },
    [enabled, moduleId, projectId, router, updateTaskSaveState]
  )

  const loadProjectTasks = useCallback(async () => {
    if (!enabled) {
      setTasks([])
      setTaskError("")
      return
    }

    setTaskError("")

    const { data, error, status, statusText } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("module_id", moduleId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

    console.log("Project tasks fetch result:", {
      data,
      error,
      status,
      statusText,
    })

    if (error) {
      console.error("Project tasks fetch failed:", error)
      console.error(
        "Project tasks fetch failed JSON:",
        JSON.stringify(error, null, 2)
      )
      setTaskError("Failed to load tasks. Please refresh and try again.")
      return
    }

    setTasks((data as ProjectTask[]) || [])
  }, [enabled, moduleId, projectId])

  const updateTaskFields = useCallback(
    async (
      taskId: number,
      fields: Partial<
        Pick<ProjectTask, "due_date" | "priority" | "status" | "completed" | "completed_at">
      >
    ) => {
      if (!enabled || isSavingTasks) return false

      const previousTasks = tasks
      const optimisticTasks = previousTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...fields,
            }
          : task
      )

      setTaskError("")
      setIsSavingTasks(true)
      updateTaskSaveState("saving")
      setTasks(optimisticTasks)

      try {
        const { data, error, status, statusText } = await supabase
          .from("project_tasks")
          .update(fields)
          .eq("id", taskId)
          .eq("project_id", projectId)
          .eq("module_id", moduleId)
          .select("*")
          .single()

        logSupabaseMutationResult("Task field update", {
          data,
          error,
          status,
          statusText,
        })

        if (error) {
          throw error
        }

        setTasks((current) =>
          current.map((task) => (task.id === taskId ? (data as ProjectTask) : task))
        )
        updateTaskSaveState("saved")
        router.refresh()
        return true
      } catch (error) {
        console.error("Task field update failed:", error)
        console.error(
          "Task field update failed JSON:",
          JSON.stringify(error, null, 2)
        )
        setTasks(previousTasks)
        setTaskError("Failed to update task. Please try again.")
        updateTaskSaveState("error")
        return false
      } finally {
        setIsSavingTasks(false)
      }
    },
    [enabled, isSavingTasks, moduleId, projectId, router, tasks, updateTaskSaveState]
  )

  useEffect(() => {
    void loadProjectTasks()
  }, [loadProjectTasks])

  useEffect(() => {
    return () => {
      if (taskSaveResetTimeoutRef.current) {
        clearTimeout(taskSaveResetTimeoutRef.current)
      }

      if (taskDeleteUndoTimeoutRef.current) {
        clearTimeout(taskDeleteUndoTimeoutRef.current)
      }
    }
  }, [])

  const handleAddTask = useCallback(async () => {
    if (!enabled || isSavingTask || isSavingTasks) return false

    const taskText = newTaskText.trim()

    if (!taskText) {
      setTaskInputError(true)
      return false
    }

    const normalizedDueDate = normalizeTaskDueDateInput(newTaskDueDate)
    const temporaryTaskId = -Date.now()
    const temporaryTask: ProjectTask = {
      id: temporaryTaskId,
      project_id: projectId,
      module_id: moduleId,
      text: taskText,
      completed: newTaskStatus === "completed",
      completed_at:
        newTaskStatus === "completed" ? new Date().toISOString() : null,
      due_date: normalizedDueDate,
      priority: newTaskPriority,
      status: newTaskStatus,
      created_at: new Date().toISOString(),
    }

    setTaskInputError(false)
    setTaskError("")
    setIsSavingTask(true)
    updateTaskSaveState("saving")
    setTasks((current) => [...current, temporaryTask])

    try {
      console.log("Updating projectId/moduleId:", { projectId, moduleId })

      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .insert([
          {
            project_id: projectId,
            module_id: moduleId,
            text: taskText,
            completed: newTaskStatus === "completed",
            completed_at:
              newTaskStatus === "completed" ? new Date().toISOString() : null,
            due_date: normalizedDueDate,
            priority: newTaskPriority,
            status: newTaskStatus,
          },
        ])
        .select("*")
        .single()

      logSupabaseMutationResult("Task update", {
        data,
        error,
        status,
        statusText,
      })

      if (error) {
        throw error
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === temporaryTaskId ? (data as ProjectTask) : task
        )
      )
      setNewTaskText("")
      setNewTaskDueDate("")
      setNewTaskPriority("medium")
      setNewTaskStatus("not_started")
      updateTaskSaveState("saved")
      newTaskInputRef.current?.focus()
      router.refresh()
      return true
    } catch (error) {
      console.error("Task update failed:", error)
      console.error("Task update failed JSON:", JSON.stringify(error, null, 2))
      setTasks((current) =>
        current.filter((task) => task.id !== temporaryTaskId)
      )
      setTaskError("Failed to update tasks. Please try again.")
      updateTaskSaveState("error")
      return false
    } finally {
      setIsSavingTask(false)
    }
  }, [
    isSavingTask,
    isSavingTasks,
    newTaskDueDate,
    newTaskPriority,
    newTaskStatus,
    newTaskText,
    enabled,
    moduleId,
    projectId,
    router,
    updateTaskSaveState,
  ])

  const handleNewTaskKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return

      event.preventDefault()

      if (!newTaskText.trim()) {
        setTaskInputError(true)
        return
      }

      void handleAddTask()
    },
    [handleAddTask, newTaskText]
  )

  const handleUpdateTaskDueDate = useCallback(
    async (taskId: number, dueDate: string) => {
      await updateTaskFields(taskId, {
        due_date: normalizeTaskDueDateInput(dueDate),
      })
    },
    [updateTaskFields]
  )

  const handleToggleTask = useCallback(
    async (taskId: number) => {
      if (!enabled || isSavingTasks) return

      const taskToUpdate = tasks.find((task) => task.id === taskId)

      if (!taskToUpdate) return

      const nextCompleted = !taskToUpdate.completed

      await updateTaskFields(taskId, {
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
        status: nextCompleted ? "completed" : "not_started",
      })
    },
    [enabled, isSavingTasks, tasks, updateTaskFields]
  )

  const handleUpdateTaskStatus = useCallback(
    async (
      taskId: number,
      status: "not_started" | "in_progress" | "completed" | "blocked"
    ) => {
      await updateTaskFields(taskId, {
        status,
        completed: status === "completed",
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
    },
    [updateTaskFields]
  )

  const handleUpdateTaskPriority = useCallback(
    async (taskId: number, priority: "low" | "medium" | "high") => {
      await updateTaskFields(taskId, { priority })
    },
    [updateTaskFields]
  )

  const handleDeleteTask = useCallback(
    (taskId: number) => {
      if (!enabled || isSavingTasks) return

      const taskToDelete = tasks.find((task) => task.id === taskId)

      if (!taskToDelete) return

      const previousPendingTask = pendingDeletedTaskRef.current

      clearPendingTaskDeleteTimeout()

      if (previousPendingTask) {
        void commitTaskDelete(previousPendingTask)
      }

      pendingDeletedTaskRef.current = taskToDelete
      setPendingDeletedTask(taskToDelete)
      setIsUndoTimerRunning(false)
      setTaskError("")
      setTasks((current) => current.filter((task) => task.id !== taskId))

      requestAnimationFrame(() => {
        setIsUndoTimerRunning(true)
      })

      taskDeleteUndoTimeoutRef.current = setTimeout(() => {
        const taskPendingDelete = pendingDeletedTaskRef.current

        if (!taskPendingDelete) return

        clearPendingTaskDeleteTimeout()
        pendingDeletedTaskRef.current = null
        setPendingDeletedTask(null)
        setIsUndoTimerRunning(false)
        void commitTaskDelete(taskPendingDelete)
      }, taskDeleteUndoDurationMs)
    },
    [
      clearPendingTaskDeleteTimeout,
      commitTaskDelete,
      enabled,
      isSavingTasks,
      tasks,
    ]
  )

  const handleUndoDeleteTask = useCallback(() => {
    const taskToRestore = pendingDeletedTaskRef.current

    if (!taskToRestore) return

    clearPendingTaskDeleteTimeout()
    pendingDeletedTaskRef.current = null
    setPendingDeletedTask(null)
    setIsUndoTimerRunning(false)
    setTasks((current) =>
      current.some((task) => task.id === taskToRestore.id)
        ? current
        : [...current, taskToRestore]
    )
  }, [clearPendingTaskDeleteTimeout])

  const taskUi: ProjectModuleTaskUiProps = enabled
    ? {
    getTaskDueDateValue,
    getTaskPriorityBadge,
    getTaskSaveStateClassName,
    getTaskSaveStateLabel,
    getTaskStatusBadge: getTaskWorkflowStatusBadge,
    handleAddTask,
    handleDeleteTask,
    handleNewTaskKeyDown,
    handleUpdateTaskPriority,
    handleUpdateTaskStatus,
    handleToggleTask,
    handleUndoDeleteTask,
    handleUpdateTaskDueDate,
    isTaskOverdue,
    isSavingTask,
    isSavingTasks,
    isUndoTimerRunning,
    newTaskDueDate,
    newTaskInputRef,
    newTaskPriority,
    newTaskStatus,
    newTaskText,
    pendingDeletedTask,
    selectedTaskFilter,
    setNewTaskPriority,
    setNewTaskStatus,
    setNewTaskDueDate,
    setNewTaskText,
    setSelectedTaskFilter,
    setTaskInputError,
    taskCounts: getTaskCounts(tasks),
    sortedTasks: sortTasksByUrgency(filterTasksByView(tasks, selectedTaskFilter)),
    taskError,
    taskInputError,
    taskSaveState,
      }
    : emptyTaskUi

  return {
    taskUi,
  }
}
