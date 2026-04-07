import { useState } from "react"
import type { Project, ProjectMetadata } from "@/lib/projects"
import { AssetsModule } from "./AssetsModule"
import { MetricsModule } from "./MetricsModule"
import { NotesModule } from "./NotesModule"
import {
  fieldCardClassName,
  humanizeProjectModuleType,
  isProjectModuleInstanceId,
  taskFilterOptions,
  taskDeleteUndoDurationMs,
} from "./helpers"
import { TimelineModule } from "./TimelineModule"
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

type TextGridRowDraft = {
  id: string
  field1: string
  field2: string
  field3: string
}

type ProjectLinkDraft = {
  id: string
  label: string
  url: string
}

function createTextGridRowDraft(
  overrides?: Partial<Omit<TextGridRowDraft, "id">>
): TextGridRowDraft {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `text-grid-row-${Date.now()}-${Math.random()}`,
    field1: overrides?.field1 ?? "",
    field2: overrides?.field2 ?? "",
    field3: overrides?.field3 ?? "",
  }
}

function createProjectLinkDraft(
  overrides?: Partial<Omit<ProjectLinkDraft, "id">>
): ProjectLinkDraft {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `project-link-${Date.now()}-${Math.random()}`,
    label: overrides?.label ?? "",
    url: overrides?.url ?? "",
  }
}

function getProjectLinkDisplayLabel(link: ProjectLinkDraft) {
  const trimmedLabel = link.label.trim()

  return trimmedLabel || link.url.trim()
}

function getProjectLinkSecondaryText(url: string) {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) return ""

  try {
    const normalizedUrl =
      /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`

    return new URL(normalizedUrl).hostname || trimmedUrl
  } catch {
    return trimmedUrl
  }
}

function getOpenableProjectLinkUrl(url: string) {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) return ""

  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
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
  const [projectLinks, setProjectLinks] = useState<ProjectLinkDraft[]>([])
  const [newProjectLink, setNewProjectLink] = useState<ProjectLinkDraft>(() =>
    createProjectLinkDraft()
  )
  const [textGridRows, setTextGridRows] = useState<TextGridRowDraft[]>([])
  const [newTextGridRow, setNewTextGridRow] = useState<TextGridRowDraft>(() =>
    createTextGridRowDraft()
  )

  function handleProjectLinkChange(
    field: keyof Omit<ProjectLinkDraft, "id">,
    value: string
  ) {
    setNewProjectLink((currentLink) => ({
      ...currentLink,
      [field]: value,
    }))
  }

  function handleAddProjectLink() {
    const normalizedLink = {
      ...newProjectLink,
      label: newProjectLink.label.trim(),
      url: newProjectLink.url.trim(),
    }

    if (!normalizedLink.url) {
      return
    }

    setProjectLinks((currentLinks) => [...currentLinks, normalizedLink])
    setNewProjectLink(createProjectLinkDraft())
  }

  function handleDeleteProjectLink(linkId: string) {
    setProjectLinks((currentLinks) =>
      currentLinks.filter((link) => link.id !== linkId)
    )
  }

  function handleTextGridRowChange(
    field: keyof Omit<TextGridRowDraft, "id">,
    value: string
  ) {
    setNewTextGridRow((currentRow) => ({
      ...currentRow,
      [field]: value,
    }))
  }

  function handleAddTextGridRow() {
    const normalizedRow = {
      ...newTextGridRow,
      field1: newTextGridRow.field1.trim(),
      field2: newTextGridRow.field2.trim(),
      field3: newTextGridRow.field3.trim(),
    }

    if (
      !normalizedRow.field1 &&
      !normalizedRow.field2 &&
      !normalizedRow.field3
    ) {
      return
    }

    setTextGridRows((currentRows) => [...currentRows, normalizedRow])
    setNewTextGridRow(createTextGridRowDraft())
  }

  function handleDeleteTextGridRow(rowId: string) {
    setTextGridRows((currentRows) =>
      currentRows.filter((row) => row.id !== rowId)
    )
  }

  function handleUpdateTextGridRow(
    rowId: string,
    field: keyof Omit<TextGridRowDraft, "id">,
    value: string
  ) {
    setTextGridRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    )
  }

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

  if (module.type === "text_grid") {
    return (
      <>
        <div className="px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {humanizeProjectModuleType(module.type).toUpperCase()}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input
              type="text"
              value={newTextGridRow.field1}
              onChange={(event) =>
                handleTextGridRowChange("field1", event.target.value)
              }
              placeholder="Field 1"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
            />
            <input
              type="text"
              value={newTextGridRow.field2}
              onChange={(event) =>
                handleTextGridRowChange("field2", event.target.value)
              }
              placeholder="Field 2"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
            />
            <input
              type="text"
              value={newTextGridRow.field3}
              onChange={(event) =>
                handleTextGridRowChange("field3", event.target.value)
              }
              placeholder="Field 3"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddTextGridRow}
              disabled={
                !newTextGridRow.field1.trim() &&
                !newTextGridRow.field2.trim() &&
                !newTextGridRow.field3.trim()
              }
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Row
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
            <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <span>Text</span>
              <span>Text</span>
              <span>Text</span>
              <span className="text-right">Delete</span>
            </div>

            {textGridRows.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-400">
                No rows added yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {textGridRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid gap-3 px-4 py-4 transition-colors duration-200 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <input
                      type="text"
                      value={row.field1}
                      onChange={(event) =>
                        handleUpdateTextGridRow(
                          row.id,
                          "field1",
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={row.field2}
                      onChange={(event) =>
                        handleUpdateTextGridRow(
                          row.id,
                          "field2",
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={row.field3}
                      onChange={(event) =>
                        handleUpdateTextGridRow(
                          row.id,
                          "field3",
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
                    />
                    <div className="flex items-center md:justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteTextGridRow(row.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  if (module.type === "notes") {
    return <NotesModule moduleId={module.id} projectId={currentProject.id} />
  }

  if (module.type === "links") {
    return (
      <>
        <div className="px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {humanizeProjectModuleType(module.type).toUpperCase()}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]">
            <input
              type="text"
              value={newProjectLink.label}
              onChange={(event) =>
                handleProjectLinkChange("label", event.target.value)
              }
              placeholder="Label"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
            />
            <input
              type="text"
              value={newProjectLink.url}
              onChange={(event) =>
                handleProjectLinkChange("url", event.target.value)
              }
              placeholder="URL"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddProjectLink}
              disabled={!newProjectLink.url.trim()}
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Link
            </button>
          </div>

          <div className="space-y-3">
            {projectLinks.length === 0 ? (
              <p className="text-sm text-slate-400">No links added yet.</p>
            ) : (
              projectLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-colors duration-200 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {getProjectLinkDisplayLabel(link)}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {getProjectLinkSecondaryText(link.url)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:shrink-0">
                    <a
                      href={getOpenableProjectLinkUrl(link.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteProjectLink(link.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    )
  }

  if (module.type === "metrics") {
    return <MetricsModule moduleId={module.id} projectId={currentProject.id} />
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
          <select
            value={taskUi.newTaskPriority}
            onChange={(event) =>
              taskUi.setNewTaskPriority(
                event.target.value as typeof taskUi.newTaskPriority
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 sm:w-40"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select
            value={taskUi.newTaskStatus}
            onChange={(event) =>
              taskUi.setNewTaskStatus(
                event.target.value as typeof taskUi.newTaskStatus
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 sm:w-40"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
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

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {taskFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => taskUi.setSelectedTaskFilter(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  taskUi.selectedTaskFilter === option.value
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Total {taskUi.taskCounts.total}</span>
            <span>Completed {taskUi.taskCounts.completed}</span>
            <span>Upcoming {taskUi.taskCounts.upcoming}</span>
            <span>Overdue {taskUi.taskCounts.overdue}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {taskUi.sortedTasks.length === 0 && (
            <p className="text-sm text-slate-400">Not added yet</p>
          )}

          {taskUi.sortedTasks.map((task) => {
            const taskStatusBadge = taskUi.getTaskStatusBadge(task)
            const taskPriorityBadge = taskUi.getTaskPriorityBadge(task)
            const isOverdueTask = taskUi.isTaskOverdue(task)

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
                    : isOverdueTask
                      ? "border-red-200 bg-red-50/60 opacity-100"
                      : task.priority === "high"
                        ? "border-amber-200 bg-amber-50/60 opacity-100"
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
                        : isOverdueTask
                          ? "text-red-700 transition-all duration-200"
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

                  <select
                    value={task.priority}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      void taskUi.handleUpdateTaskPriority(
                        task.id,
                        event.target.value as typeof task.priority
                      )
                    }
                    disabled={taskUi.isSavingTasks}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>

                  <select
                    value={task.status}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      void taskUi.handleUpdateTaskStatus(
                        task.id,
                        event.target.value as typeof task.status
                      )
                    }
                    disabled={taskUi.isSavingTasks}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>

                  <span
                    onClick={(event) => event.stopPropagation()}
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${taskStatusBadge.className}`}
                  >
                    {taskStatusBadge.label}
                  </span>

                  <span
                    onClick={(event) => event.stopPropagation()}
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${taskPriorityBadge.className}`}
                  >
                    {taskPriorityBadge.label}
                  </span>

                  {isOverdueTask && (
                    <span
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700"
                    >
                      Overdue
                    </span>
                  )}

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
      <TimelineModule
        moduleId={isProjectModuleInstanceId(module.id) ? module.id : null}
        projectId={currentProject.id}
      />
    )
  }

  if (module.type === "assets") {
    return (
      <AssetsModule
        moduleId={isProjectModuleInstanceId(module.id) ? module.id : null}
        projectId={currentProject.id}
      />
    )
  }

  return <CustomProjectModulePlaceholder module={module} />
}
