import type { ReactNode } from "react"
import { cn } from "@/lib/ui"

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  titleClassName,
  actionClassName,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
  titleClassName?: string
  actionClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-xl font-semibold text-[var(--color-text-primary)]",
            titleClassName
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={cn("shrink-0", actionClassName)}>{action}</div> : null}
    </div>
  )
}
