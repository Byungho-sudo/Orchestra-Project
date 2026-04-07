"use client"

import { useEffect, useState } from "react"
import { getDeadlineBadgeClass } from "@/lib/project-deadline"
import type { Project, ProjectHealth, ProjectStatus } from "@/lib/projects"
import { detailCardClassName } from "./helpers"
import { useProjectHealthSummary } from "./hooks/useProjectHealthSummary"

function SummaryMetric({
  emphasis = "primary",
  label,
  value,
}: {
  emphasis?: "primary" | "secondary"
  label: string
  value: string
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] ${
        emphasis === "secondary" ? "bg-slate-50/70" : ""
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.16em] ${
          emphasis === "secondary" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 font-semibold text-slate-900 ${
          emphasis === "secondary" ? "text-base" : "text-lg"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function humanizeProjectValue(value?: string | null) {
  if (!value) {
    return "Unknown"
  }

  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function ProjectHealthSummary({
  isUpdatingSummary,
  onUpdateSummaryFields,
  project,
  summaryError,
}: {
  isUpdatingSummary: boolean
  onUpdateSummaryFields: (updates: {
    health: ProjectHealth
    status: ProjectStatus
  }) => Promise<boolean>
  project: Project
  summaryError: string
}) {
  const { error, isLoading, summary } = useProjectHealthSummary({ project })
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [draftStatus, setDraftStatus] = useState(project.status)
  const [draftHealth, setDraftHealth] = useState(project.health)

  useEffect(() => {
    setDraftStatus(project.status)
    setDraftHealth(project.health)
  }, [project.health, project.status])

  async function handleSaveSummaryFields() {
    const didUpdateSummary = await onUpdateSummaryFields({
      health: draftHealth,
      status: draftStatus,
    })

    if (didUpdateSummary) {
      setIsEditingSummary(false)
    }
  }

  return (
    <section className={`${detailCardClassName} mt-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Project Health
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Default view answers whether the project looks healthy. Details below
            explain why.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${getDeadlineBadgeClass(
              summary.deadlineStatus
            )}`}
          >
            {summary.deadlineStatus}
          </span>

          {isEditingSummary ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraftStatus(project.status)
                  setDraftHealth(project.health)
                  setIsEditingSummary(false)
                }}
                disabled={isUpdatingSummary}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveSummaryFields()}
                disabled={isUpdatingSummary}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingSummary ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingSummary(true)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit Health
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}
      {summaryError && (
        <p className="mt-4 text-sm font-medium text-red-600">{summaryError}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Project Status
          </p>
          {isEditingSummary ? (
            <select
              value={draftStatus}
              onChange={(event) =>
                setDraftStatus(event.target.value as ProjectStatus)
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ) : (
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {humanizeProjectValue(summary.status)}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Health
          </p>
          {isEditingSummary ? (
            <select
              value={draftHealth}
              onChange={(event) =>
                setDraftHealth(event.target.value as ProjectHealth)
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            >
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="off_track">Off Track</option>
            </select>
          ) : (
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {humanizeProjectValue(summary.health)}
            </p>
          )}
        </div>

        <SummaryMetric
          label="Progress"
          value={
            typeof summary.progress === "number"
              ? `${summary.progress}%`
              : "Unknown"
          }
        />

        <SummaryMetric label="Due Date State" value={summary.deadlineStatus} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden="true" className="text-base leading-none">
            {isExpanded ? "▾" : "▸"}
          </span>
          {isExpanded ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Execution Details
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryMetric
              emphasis="secondary"
              label="Tasks"
              value={
                isLoading
                  ? "Loading..."
                  : `${summary.completedTaskCount}/${summary.totalTaskCount} complete`
              }
            />
            <SummaryMetric
              emphasis="secondary"
              label="Milestones"
              value={
                isLoading
                  ? "Loading..."
                  : `${summary.completedMilestoneCount}/${summary.totalMilestoneCount} complete`
              }
            />
            <SummaryMetric
              emphasis="secondary"
              label="Overdue Tasks"
              value={isLoading ? "Loading..." : String(summary.overdueTaskCount)}
            />
            <SummaryMetric
              emphasis="secondary"
              label="Total Tasks"
              value={isLoading ? "Loading..." : String(summary.totalTaskCount)}
            />
            <SummaryMetric
              emphasis="secondary"
              label="Blocked Milestones"
              value={
                isLoading ? "Loading..." : String(summary.blockedMilestoneCount)
              }
            />
          </div>
        </div>
      )}
    </section>
  )
}
