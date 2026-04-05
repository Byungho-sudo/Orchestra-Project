import Link from "next/link"
import type { Project } from "@/lib/projects"
import { detailCardClassName } from "./helpers"

export function ProjectDetailHeader({
  project,
}: {
  project: Project
}) {
  return (
    <div className={detailCardClassName}>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <Link
            href="/projects"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Back to projects
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Project Detail
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {project.name}
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            {project.description?.trim() || "No description provided."}
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Project ID
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {project.id}
          </p>
        </div>
      </div>
    </div>
  )
}
