export function ModuleDropPlaceholder({
  isVisible,
}: {
  isVisible: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden transition-[max-height,opacity,margin] duration-150 ease-out ${
        isVisible ? "my-5 max-h-32 opacity-100" : "my-0 max-h-0 opacity-0"
      }`}
    >
      <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/70 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="h-16 rounded-2xl border border-indigo-100/80 bg-white/70" />
      </div>
    </div>
  )
}
