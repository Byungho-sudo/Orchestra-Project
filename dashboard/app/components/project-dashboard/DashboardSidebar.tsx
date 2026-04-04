export function DashboardSidebar() {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Sidebar
      </h2>

      <nav className="space-y-2 text-sm">
        <a className="block rounded-md bg-indigo-50 px-3 py-2 font-medium text-indigo-700">
          Overview
        </a>
        <a className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
          Projects
        </a>
        <a className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
          Team
        </a>
        <a className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
          Reports
        </a>
      </nav>
    </aside>
  )
}
