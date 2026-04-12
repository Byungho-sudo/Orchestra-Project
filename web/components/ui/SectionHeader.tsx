import type { ReactNode } from "react"

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
