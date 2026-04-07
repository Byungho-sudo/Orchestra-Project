import { getDeadlineBadgeClass } from "@/lib/project-deadline"
import type { Project } from "@/lib/projects"
import { detailCardClassName } from "./helpers"
import { useProjectHealthSummary } from "./hooks/useProjectHealthSummary"

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
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
  project,
}: {
  project: Project
}) {
  const { error, isLoading, summary } = useProjectHealthSummary({ project })

  return (
    <section className={`${detailCardClassName} mt-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Project Health Summary
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A quick read on delivery progress, execution load, and milestone risk.
          </p>
        </div>

        <span
          className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${getDeadlineBadgeClass(
            summary.deadlineStatus
          )}`}
        >
          {summary.deadlineStatus}
        </span>
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Project Status"
          value={humanizeProjectValue(summary.status)}
        />
        <SummaryMetric
          label="Health"
          value={humanizeProjectValue(summary.health)}
        />
        <SummaryMetric
          label="Progress"
          value={
            typeof summary.progress === "number"
              ? `${summary.progress}%`
              : "Unknown"
          }
        />
        <SummaryMetric
          label="Tasks"
          value={
            isLoading
              ? "Loading..."
              : `${summary.completedTaskCount}/${summary.totalTaskCount} complete`
          }
        />
        <SummaryMetric
          label="Milestones"
          value={
            isLoading
              ? "Loading..."
              : `${summary.completedMilestoneCount}/${summary.totalMilestoneCount} complete`
          }
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Due Date State" value={summary.deadlineStatus} />
        <SummaryMetric
          label="Overdue Tasks"
          value={isLoading ? "Loading..." : String(summary.overdueTaskCount)}
        />
        <SummaryMetric
          label="Blocked Milestones"
          value={isLoading ? "Loading..." : String(summary.blockedMilestoneCount)}
        />
        <SummaryMetric
          label="Total Tasks"
          value={isLoading ? "Loading..." : String(summary.totalTaskCount)}
        />
      </div>
    </section>
  )
}
