import type { DefaultProjectModuleType } from "@/lib/project-modules"
import type { ProjectTask } from "@/lib/projects"
import type {
  Dispatch,
  KeyboardEvent,
  RefObject,
  SetStateAction,
} from "react"

export type TaskSaveState = "idle" | "saving" | "saved" | "error"

export type ProjectModuleType =
  | DefaultProjectModuleType
  | "workspace_plan"
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
  getTaskSaveStateClassName: (taskSaveState: TaskSaveState) => string
  getTaskSaveStateLabel: (taskSaveState: TaskSaveState) => string
  getTaskStatusBadge: (task: ProjectTask) => TaskBadge
  handleAddTask: () => void | Promise<unknown>
  handleDeleteTask: (taskId: number) => void
  handleNewTaskKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
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
  newTaskText: string
  pendingDeletedTask: ProjectTask | null
  selectedTaskFilter: TaskFilterOption
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
