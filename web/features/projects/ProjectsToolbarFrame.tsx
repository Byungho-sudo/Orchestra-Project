import type { ReactNode } from "react"

export function ProjectsToolbarFrame({
  title,
  primaryControl,
  secondaryControls,
}: {
  title: ReactNode
  primaryControl: ReactNode
  secondaryControls: ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--theme-shell-border)] bg-[var(--theme-shell)] p-4 shadow-[var(--color-toolbar-shadow)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
        <div className="min-w-0">{title}</div>

        <div className="min-w-0">
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
            {primaryControl}
            <div className="flex items-center gap-2">{secondaryControls}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
