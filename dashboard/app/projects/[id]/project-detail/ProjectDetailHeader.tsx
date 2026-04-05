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
      <div className="max-w-2xl">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-slate-500"
        >
          <Link
            href="/projects"
            className="font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Projects
          </Link>
          <span className="text-slate-300">/</span>
          <span className="truncate text-slate-900">{project.name}</span>
        </nav>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Project Detail
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {project.name}
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600">
          {project.description?.trim() || "No description provided."}
        </p>
      </div>
    </div>
  )
}
