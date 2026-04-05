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
      className={`overflow-hidden transition-[max-height,opacity] duration-150 ease-out ${
        isVisible ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="h-[46px] rounded-xl border border-dashed border-indigo-200 bg-indigo-50/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]" />
    </div>
  )
}
