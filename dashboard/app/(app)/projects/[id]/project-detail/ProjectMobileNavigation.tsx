import { ProjectModalShell } from "@/features/projects/ProjectModalShell"

type NavigationItem = {
  id: string
  label: string
  moduleId: string | null
}

export function ProjectMobileNavigation({
  activeSection,
  fixedItem,
  isAddDisabled,
  isOpen,
  onAddModule,
  onClose,
  onSelectSection,
  sortableItems,
}: {
  activeSection: string
  fixedItem: NavigationItem
  isAddDisabled: boolean
  isOpen: boolean
  onAddModule: () => void
  onClose: () => void
  onSelectSection: (sectionId: string) => void
  sortableItems: NavigationItem[]
}) {
  if (!isOpen) return null

  return (
    <ProjectModalShell
      overlayClassName="fixed inset-0 z-50 bg-slate-900/40 overscroll-none lg:hidden"
      panelClassName="absolute left-0 top-0 h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-r-2xl bg-slate-50 p-5 shadow-xl"
      onClose={onClose}
    >
      {({ requestClose }) => (
        <>
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Modules
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Project Navigation
              </h2>
            </div>

            <button
              type="button"
              onClick={requestClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <nav className="mt-4 text-sm">
            <button
              type="button"
              onClick={() => {
                requestClose()
                requestAnimationFrame(() => {
                  onSelectSection(fixedItem.id)
                })
              }}
              className={`flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors ${
                activeSection === fixedItem.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
              }`}
            >
              {fixedItem.label}
            </button>

            {sortableItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  requestClose()
                  requestAnimationFrame(() => {
                    onSelectSection(item.id)
                  })
                }}
                className={`mt-1.5 flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              disabled={isAddDisabled}
              onClick={() => {
                onAddModule()
                requestClose()
              }}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-base font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-white/80 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Module
            </button>
          </nav>
        </>
      )}
    </ProjectModalShell>
  )
}
