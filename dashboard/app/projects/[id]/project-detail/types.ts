import type { DefaultProjectModuleType } from "@/lib/project-modules"
import type {
  ProjectTask,
  ProjectTaskPriority,
  ProjectTaskStatus,
} from "@/lib/projects"
import type {
  Dispatch,
  KeyboardEvent,
  RefObject,
  SetStateAction,
} from "react"

export type TaskSaveState = "idle" | "saving" | "saved" | "error"

export type ProjectModuleType =
  | DefaultProjectModuleType
  | "text_grid"
  | "notes"
  | "metrics"
  | "links"

export type ProjectWorkspaceModule = {
  id: string
  title: string
  type: ProjectModuleType
  order: number
}

export type ModuleDropPosition = "before" | "after"

export type ProjectModuleRecord = {
  id: string
  title: string
  type: ProjectModuleType | "tasks"
  order: number
}

export type CreateProjectModuleForm = {
  title: string
  type: ProjectModuleType
}

export type ProjectMetadataDraft = {
  id: string
  key: string
  value: string
  order: number
}

export type TaskBadge = {
  label: string
  className: string
}

export type TaskFilterOption = "all" | "overdue" | "upcoming" | "completed"

export type ProjectModuleTaskUiProps = {
  getTaskDueDateValue: (dueDate: string | null) => string
  getTaskPriorityBadge: (task: ProjectTask) => TaskBadge
  getTaskSaveStateClassName: (taskSaveState: TaskSaveState) => string
  getTaskSaveStateLabel: (taskSaveState: TaskSaveState) => string
  getTaskStatusBadge: (task: ProjectTask) => TaskBadge
  handleAddTask: () => void | Promise<unknown>
  handleDeleteTask: (taskId: number) => void
  handleNewTaskKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  handleUpdateTaskPriority: (
    taskId: number,
    priority: ProjectTaskPriority
  ) => void | Promise<unknown>
  handleUpdateTaskStatus: (
    taskId: number,
    status: ProjectTaskStatus
  ) => void | Promise<unknown>
  handleToggleTask: (taskId: number) => void | Promise<unknown>
  handleUndoDeleteTask: () => void
  handleUpdateTaskDueDate: (
    taskId: number,
    dueDate: string
  ) => void | Promise<unknown>
  isTaskOverdue: (task: ProjectTask) => boolean
  isSavingTask: boolean
  isSavingTasks: boolean
  isUndoTimerRunning: boolean
  newTaskDueDate: string
  newTaskInputRef: RefObject<HTMLInputElement | null>
  newTaskPriority: ProjectTaskPriority
  newTaskStatus: ProjectTaskStatus
  newTaskText: string
  pendingDeletedTask: ProjectTask | null
  selectedTaskFilter: TaskFilterOption
  setNewTaskPriority: Dispatch<SetStateAction<ProjectTaskPriority>>
  setNewTaskStatus: Dispatch<SetStateAction<ProjectTaskStatus>>
  setNewTaskDueDate: Dispatch<SetStateAction<string>>
  setNewTaskText: Dispatch<SetStateAction<string>>
  setSelectedTaskFilter: Dispatch<SetStateAction<TaskFilterOption>>
  setTaskInputError: Dispatch<SetStateAction<boolean>>
  taskCounts: {
    completed: number
    overdue: number
    total: number
    upcoming: number
  }
  sortedTasks: ProjectTask[]
  taskError: string
  taskInputError: boolean
  taskSaveState: TaskSaveState
}
