import type { HTMLAttributes } from "react"
import { cn } from "@/lib/ui"

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger" | "info"

const variantClassNames: Record<BadgeVariant, string> = {
  neutral:
    "border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]",
  brand:
    "border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  success:
    "border-[var(--color-status-success-border)] bg-[var(--color-status-success-soft)] text-[var(--color-status-success)]",
  warning:
    "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning)]",
  danger:
    "border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-soft)] text-[var(--color-status-danger)]",
  info: "border-[var(--color-status-info-border)] bg-[var(--color-status-info-soft)] text-[var(--color-status-info)]",
}

export function Badge({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] border px-2 py-0.5 text-xs font-semibold",
        variantClassNames[variant],
        className
      )}
      {...props}
    />
  )
}
