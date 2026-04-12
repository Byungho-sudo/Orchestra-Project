import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/ui"

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] outline-none transition focus:ring-2 focus:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}
