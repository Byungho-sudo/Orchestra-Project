"use client"

export function ProjectsEmptyState({
  onCreateProject,
}: {
  onCreateProject: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">No projects yet</h3>
      <p className="mt-2 text-sm text-slate-600">
        Create your first project to start building your dashboard.
      </p>
      <button
        onClick={onCreateProject}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Create First Project
      </button>
    </div>
  )
}

export function ProjectsNoMatchesState({
  hasSearchQuery,
}: {
  hasSearchQuery: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        No matching projects
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        {hasSearchQuery
          ? "No projects match your current search."
          : "No projects match your selected deadline filter."}
      </p>
    </div>
  )
}
