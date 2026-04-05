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
      className={`overflow-hidden transition-[max-height,opacity,margin] duration-150 ease-out ${
        isVisible ? "my-5 opacity-100" : "my-0 max-h-0 opacity-0"
      }`}
      style={
        isVisible
          ? {
              maxHeight: `${placeholderHeight}px`,
            }
          : undefined
      }
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
