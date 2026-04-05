import type { Project, ProjectMetadata } from "@/lib/projects"
import {
  fieldCardClassName,
  humanizeProjectModuleType,
  isProjectModuleInstanceId,
  taskDeleteUndoDurationMs,
} from "./helpers"
import { useProjectTasks } from "./hooks/useProjectTasks"
import type {
  ProjectModuleType,
  ProjectWorkspaceModule,
} from "./types"

function WorkspaceValue({ value }: { value: string | null }) {
  return (
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
      {value?.trim() || <span className="text-slate-400">Not added yet</span>}
    </p>
  )
}

function CustomProjectModulePlaceholder({
  module,
}: {
  module: ProjectWorkspaceModule
}) {
  const moduleDescriptions: Partial<Record<ProjectModuleType, string>> = {
    text_grid: "Organize structured text fields in this module.",
    notes: "Capture long-form notes and working context here.",
    checklist: "Track custom checklist items in this module.",
    metrics: "Summarize key project metrics in this module.",
    links: "Collect important project links and references here.",
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {module.title}
      </p>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        {moduleDescriptions[module.type] ||
          "This custom module is ready for a future content pass."}
      </p>
    </>
  )
}

export function ProjectModuleContent({
  currentProject,
  module,
  sortedProjectMetadata,
}: {
  currentProject: Project
  module: ProjectWorkspaceModule
  sortedProjectMetadata: ProjectMetadata[]
}) {
  const { taskUi } = useProjectTasks({
    enabled:
      module.type === "checklist" && isProjectModuleInstanceId(module.id),
    moduleId: module.id,
    projectId: currentProject.id,
  })

  if (module.type === "workspace_plan") {
    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Project Overview
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {module.title}
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className={fieldCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {currentProject.status}
            </p>
          </div>
          <div className={fieldCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visibility
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {currentProject.visibility}
            </p>
          </div>
          <div className={fieldCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due Date
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {currentProject.due_date ?? "No due date"}
            </p>
          </div>
          <div className={fieldCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {currentProject.progress}%
            </p>
          </div>
          <div className={`${fieldCardClassName} md:col-span-2`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </p>
            <WorkspaceValue value={currentProject.description} />
          </div>
        </div>
      </>
    )
  }

  if (module.type === "planning_operations") {
    return (
      <>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {module.title}
        </p>

        {sortedProjectMetadata.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            No custom metadata has been added for this project yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sortedProjectMetadata.map((metadata) => (
              <div key={metadata.id} className={fieldCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {metadata.key}
                </p>
                <WorkspaceValue value={metadata.value} />
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  if (module.type === "checklist") {
    return (
      <>
        <div className="flex items-center justify-between gap-3 px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {humanizeProjectModuleType(module.type).toUpperCase()}
          </p>

          {taskUi.taskSaveState !== "idle" && (
            <p
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${taskUi.getTaskSaveStateClassName(
                taskUi.taskSaveState
              )}`}
            >
              {taskUi.getTaskSaveStateLabel(taskUi.taskSaveState)}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            ref={taskUi.newTaskInputRef}
            type="text"
            value={taskUi.newTaskText}
            onChange={(event) => {
              taskUi.setNewTaskText(event.target.value)
              if (taskUi.taskInputError && event.target.value.trim()) {
                taskUi.setTaskInputError(false)
              }
            }}
            onKeyDown={taskUi.handleNewTaskKeyDown}
            placeholder="Add a checklist item"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500 ${
              taskUi.taskInputError
                ? "border-red-300 bg-red-50"
                : "border-slate-300"
            }`}
          />
          <input
            type="date"
            value={taskUi.newTaskDueDate}
            onChange={(event) => taskUi.setNewTaskDueDate(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 sm:w-40"
          />
          <button
            onClick={() => void taskUi.handleAddTask()}
            disabled={taskUi.isSavingTask || !taskUi.newTaskText.trim()}
            className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add Item
          </button>
        </div>

        {taskUi.taskError && (
          <p className="mt-3 text-sm font-medium text-red-600">
            {taskUi.taskError}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {taskUi.sortedTasks.length === 0 && (
            <p className="text-sm text-slate-400">Not added yet</p>
          )}

          {taskUi.sortedTasks.map((task) => {
            const taskStatusBadge = taskUi.getTaskStatusBadge(task)

            return (
              <div
                key={task.id}
                onClick={() => {
                  if (taskUi.isSavingTasks) return
                  void taskUi.handleToggleTask(task.id)
                }}
                className={`flex flex-col gap-3 rounded-xl border border-slate-200 p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between ${
                  task.completed
                    ? "bg-slate-50 opacity-80"
                    : "bg-white opacity-100"
                } hover:bg-slate-50 ${taskUi.isSavingTasks ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex flex-1 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => void taskUi.handleToggleTask(task.id)}
                    disabled={taskUi.isSavingTasks}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span
                    className={
                      task.completed
                        ? "text-slate-400 line-through transition-all duration-200"
                        : "text-slate-700 transition-all duration-200"
                    }
                    >
                      {task.text}
                    </span>
                </div>

                <div
                  onClick={(event) => event.stopPropagation()}
                  className="flex flex-wrap items-center gap-2 sm:justify-end"
                >
                  <input
                    type="date"
                    value={taskUi.getTaskDueDateValue(task.due_date)}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      void taskUi.handleUpdateTaskDueDate(task.id, event.target.value)
                    }
                    disabled={taskUi.isSavingTasks}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <span
                    onClick={(event) => event.stopPropagation()}
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${taskStatusBadge.className}`}
                  >
                    {taskStatusBadge.label}
                  </span>

                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      taskUi.handleDeleteTask(task.id)
                    }}
                    disabled={taskUi.isSavingTasks}
                    className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            taskUi.pendingDeletedTask
              ? "mt-4 max-h-24 opacity-100"
              : "mt-0 max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 [&>button]:hidden [&>span]:hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                Deleted: {taskUi.pendingDeletedTask?.text ?? ""}
              </span>
              <button
                type="button"
                onClick={taskUi.handleUndoDeleteTask}
                className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
              >
                Undo
              </button>
            </div>

            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full origin-left rounded-full bg-indigo-500 transition-transform ease-linear"
                style={{
                  transform: taskUi.isUndoTimerRunning ? "scaleX(0)" : "scaleX(1)",
                  transitionDuration: `${taskDeleteUndoDurationMs}ms`,
                }}
              />
            </div>
            <span>Task deleted â€” Undo</span>
            <button
              type="button"
              onClick={taskUi.handleUndoDeleteTask}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Undo
            </button>
          </div>
        </div>
      </>
    )
  }

  if (module.type === "timeline") {
    return (
      <>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {module.title}
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Timeline details can be organized here in a future pass.
        </p>
      </>
    )
  }

  if (module.type === "assets") {
    return (
      <>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {module.title}
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Project assets can be organized here in a future pass.
        </p>
      </>
    )
  }

  return <CustomProjectModulePlaceholder module={module} />
}
