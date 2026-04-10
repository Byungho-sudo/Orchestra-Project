import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/ui"

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}
