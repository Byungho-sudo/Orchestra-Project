import type { DragEventHandler } from "react"

export function NavDropPlaceholder({
  isVisible,
  onDragOver,
  onDrop,
}: {
  isVisible: boolean
  onDragOver?: DragEventHandler<HTMLDivElement>
  onDrop?: DragEventHandler<HTMLDivElement>
}) {
  return (
    <div
      aria-hidden="true"
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`overflow-hidden transition-[max-height,opacity,margin] duration-150 ease-out ${
        isVisible ? "my-1.5 max-h-20 opacity-100" : "my-0 max-h-0 opacity-0"
      }`}
    >
      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/80 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <div className="mb-2 h-px rounded-full bg-indigo-400/90 shadow-[0_0_0_2px_rgba(238,242,255,0.95)]" />
        <div className="h-8 rounded-lg border border-indigo-100/80 bg-white/75" />
      </div>
    </div>
  )
}
