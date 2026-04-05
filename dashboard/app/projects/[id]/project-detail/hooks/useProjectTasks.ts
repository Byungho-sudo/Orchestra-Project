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
  getTaskDueDateValue,
  getTaskSaveStateClassName,
  getTaskSaveStateLabel,
  getTaskStatusBadge,
  logSupabaseMutationResult,
  normalizeTaskDueDateInput,
  sortTasksByUrgency,
  taskDeleteUndoDurationMs,
} from "../helpers"
import type { ProjectModuleTaskUiProps, TaskSaveState } from "../types"

const emptyTaskUi: ProjectModuleTaskUiProps = {
  getTaskDueDateValue,
  getTaskSaveStateClassName,
  getTaskSaveStateLabel,
  getTaskStatusBadge,
  handleAddTask: () => {},
  handleDeleteTask: () => {},
  handleNewTaskKeyDown: () => {},
  handleToggleTask: () => {},
  handleUndoDeleteTask: () => {},
  handleUpdateTaskDueDate: () => {},
  isSavingTask: false,
  isSavingTasks: false,
  isUndoTimerRunning: false,
  newTaskDueDate: "",
  newTaskInputRef: { current: null },
  newTaskText: "",
  pendingDeletedTask: null,
  setNewTaskDueDate: () => "",
  setNewTaskText: () => "",
  setTaskInputError: () => false,
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
      completed: false,
      completed_at: null,
      due_date: normalizedDueDate,
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
            completed: false,
            completed_at: null,
            due_date: normalizedDueDate,
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
      if (!enabled || isSavingTasks) return

      setTaskError("")
      setIsSavingTasks(true)
      updateTaskSaveState("saving")

      try {
        const normalizedDueDate = normalizeTaskDueDateInput(dueDate)

        console.log("Updating projectId/moduleId:", { projectId, moduleId })

        const { data, error, status, statusText } = await supabase
          .from("project_tasks")
          .update({ due_date: normalizedDueDate })
          .eq("id", taskId)
          .eq("project_id", projectId)
          .eq("module_id", moduleId)
          .select("*")
          .single()

        logSupabaseMutationResult("Task due date update", {
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
            task.id === taskId ? (data as ProjectTask) : task
          )
        )
        updateTaskSaveState("saved")
        router.refresh()
      } catch (error) {
        console.error("Task due date update failed:", error)
        console.error(
          "Task due date update failed JSON:",
          JSON.stringify(error, null, 2)
        )
        setTaskError("Failed to update task due date. Please try again.")
        updateTaskSaveState("error")
      } finally {
        setIsSavingTasks(false)
      }
    },
    [enabled, isSavingTasks, moduleId, projectId, router, updateTaskSaveState]
  )

  const handleToggleTask = useCallback(
    async (taskId: number) => {
      if (!enabled || isSavingTasks) return

      const taskToUpdate = tasks.find((task) => task.id === taskId)

      if (!taskToUpdate) return

      setTaskError("")
      setIsSavingTasks(true)
      updateTaskSaveState("saving")

      try {
        const nextCompleted = !taskToUpdate.completed

        console.log("Updating projectId/moduleId:", { projectId, moduleId })

        const { data, error, status, statusText } = await supabase
          .from("project_tasks")
          .update({
            completed: nextCompleted,
            completed_at: nextCompleted ? new Date().toISOString() : null,
          })
          .eq("id", taskId)
          .eq("project_id", projectId)
          .eq("module_id", moduleId)
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
            task.id === taskId ? (data as ProjectTask) : task
          )
        )
        updateTaskSaveState("saved")
        router.refresh()
      } catch (error) {
        console.error("Task update failed:", error)
        console.error("Task update failed JSON:", JSON.stringify(error, null, 2))
        setTaskError("Failed to update tasks. Please try again.")
        updateTaskSaveState("error")
      } finally {
        setIsSavingTasks(false)
      }
    },
    [enabled, isSavingTasks, moduleId, projectId, router, tasks, updateTaskSaveState]
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
    getTaskSaveStateClassName,
    getTaskSaveStateLabel,
    getTaskStatusBadge,
    handleAddTask,
    handleDeleteTask,
    handleNewTaskKeyDown,
    handleToggleTask,
    handleUndoDeleteTask,
    handleUpdateTaskDueDate,
    isSavingTask,
    isSavingTasks,
    isUndoTimerRunning,
    newTaskDueDate,
    newTaskInputRef,
    newTaskText,
    pendingDeletedTask,
    setNewTaskDueDate,
    setNewTaskText,
    setTaskInputError,
    sortedTasks: sortTasksByUrgency(tasks),
    taskError,
    taskInputError,
    taskSaveState,
      }
    : emptyTaskUi

  return {
    taskUi,
  }
}
