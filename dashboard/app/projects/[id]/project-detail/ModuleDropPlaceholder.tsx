export function ModuleDropPlaceholder({
  height,
  isVisible,
}: {
  height?: number | null
  isVisible: boolean
}) {
  const resolvedHeight = Math.max(0, Math.round(height ?? 0))
  const placeholderHeight = resolvedHeight || 176

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden transition-opacity duration-120 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        height: isVisible ? `${placeholderHeight}px` : "0px",
      }}
    >
      <div
        className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        style={{
          height: `${placeholderHeight}px`,
        }}
      >
        <div
          className="rounded-[22px] border border-indigo-100/80 bg-white/70"
          style={{
            height: `${placeholderHeight}px`,
          }}
        />
      </div>
    </div>
  )
}
