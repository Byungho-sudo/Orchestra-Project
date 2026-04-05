import { ModalShell } from "@/app/components/project-dashboard/ModalShell"
import { SidebarItem } from "@/app/components/layout/Sidebar"

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
    <ModalShell
      overlayClassName="fixed inset-0 z-50 bg-slate-900/40 lg:hidden"
      panelClassName="absolute left-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-slate-50 p-5 shadow-xl"
      onClose={onClose}
    >
      {({ requestClose }) => (
        <>
          <div className="flex items-center justify-between">
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

          <nav className="mt-6 space-y-2 text-sm">
            <SidebarItem
              isActive={activeSection === fixedItem.id}
              onClick={() => {
                onSelectSection(fixedItem.id)
                requestClose()
              }}
            >
              {fixedItem.label}
            </SidebarItem>

            {sortableItems.map((item) => (
              <SidebarItem
                key={item.id}
                isActive={activeSection === item.id}
                onClick={() => {
                  onSelectSection(item.id)
                  requestClose()
                }}
              >
                {item.label}
              </SidebarItem>
            ))}

            <SidebarItem
              disabled={isAddDisabled}
              onClick={() => {
                onAddModule()
                requestClose()
              }}
              className="flex h-11 w-full items-center justify-center border-dashed text-lg font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              +
            </SidebarItem>
          </nav>
        </>
      )}
    </ModalShell>
  )
}
