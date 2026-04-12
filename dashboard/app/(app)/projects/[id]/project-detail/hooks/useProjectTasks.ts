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
  getTaskSaveStateClassName,
  getTaskSaveStateLabel,
  getTaskStatusBadge,
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
  getTaskSaveStateClassName,
  getTaskSaveStateLabel,
  getTaskStatusBadge,
  handleAddTask: () => {},
  handleDeleteTask: () => {},
  handleNewTaskKeyDown: () => {},
  handleToggleTask: () => {},
  handleUndoDeleteTask: () => {},
  handleUpdateTaskDueDate: () => {},
  isTaskOverdue,
  isSavingTask: false,
  isSavingTasks: false,
  isUndoTimerRunning: false,
  newTaskDueDate: "",
  newTaskInputRef: { current: null },
  newTaskText: "",
  pendingDeletedTask: null,
  selectedTaskFilter: "all",
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
    [enabled, moduleId, router, updateTaskSaveState]
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
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

    logSupabaseMutationResult("Project tasks fetch", {
      data,
      error,
      status,
      statusText,
    })

    if (error) {
      setTaskError("Failed to load tasks. Please refresh and try again.")
      return
    }

    setTasks((data as ProjectTask[]) || [])
  }, [enabled, moduleId, projectId])

  const updateTaskFields = useCallback(
    async (
      taskId: number,
      fields: Partial<Pick<ProjectTask, "due_date" | "completed" | "notes">>
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
    const nextOrder =
      tasks.length === 0
        ? 0
        : Math.max(...tasks.map((task) => task.order ?? 0)) + 1
    const temporaryTaskId = -Date.now()
    const temporaryTask: ProjectTask = {
      id: temporaryTaskId,
      project_id: projectId,
      module_id: moduleId,
      text: taskText,
      completed: false,
      due_date: normalizedDueDate,
      notes: null,
      order: nextOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setTaskInputError(false)
    setTaskError("")
    setIsSavingTask(true)
    updateTaskSaveState("saving")
    setTasks((current) => [...current, temporaryTask])

    try {
      const { data, error, status, statusText } = await supabase
        .from("project_tasks")
        .insert([
          {
            project_id: projectId,
            module_id: moduleId,
            text: taskText,
            completed: false,
            due_date: normalizedDueDate,
            order: nextOrder,
          },
        ])
        .select("*")
        .single()

      logSupabaseMutationResult("Task insert", {
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
      console.error("Task insert failed:", error)
      console.error("Task insert failed JSON:", JSON.stringify(error, null, 2))
      setTasks((current) =>
        current.filter((task) => task.id !== temporaryTaskId)
      )
      setTaskError("Failed to create checklist item. Please try again.")
      updateTaskSaveState("error")
      return false
    } finally {
      setIsSavingTask(false)
    }
  }, [
    enabled,
    isSavingTask,
    isSavingTasks,
    moduleId,
    newTaskDueDate,
    newTaskText,
    projectId,
    router,
    tasks,
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

      await updateTaskFields(taskId, {
        completed: !taskToUpdate.completed,
      })
    },
    [enabled, isSavingTasks, tasks, updateTaskFields]
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
        isTaskOverdue,
        isSavingTask,
        isSavingTasks,
        isUndoTimerRunning,
        newTaskDueDate,
        newTaskInputRef,
        newTaskText,
        pendingDeletedTask,
        selectedTaskFilter,
        setNewTaskDueDate,
        setNewTaskText,
        setSelectedTaskFilter,
        setTaskInputError,
        taskCounts: getTaskCounts(tasks),
        sortedTasks: sortTasksByUrgency(
          filterTasksByView(tasks, selectedTaskFilter)
        ),
        taskError,
        taskInputError,
        taskSaveState,
      }
    : emptyTaskUi

  return {
    taskUi,
  }
}
