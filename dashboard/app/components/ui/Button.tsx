import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/ui"

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"
type ButtonSize = "sm" | "md" | "icon"

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand)] text-white hover:bg-indigo-500 border-transparent",
  secondary:
    "border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-slate-50",
  danger:
    "bg-[var(--color-danger)] text-white hover:bg-rose-500 border-transparent",
  ghost:
    "border-transparent text-[var(--color-text-secondary)] hover:bg-slate-100",
}

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-10 px-4 py-2 text-sm",
  icon: "h-10 w-10 p-0",
}

export function Button({
  className,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] border font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
        variantClassNames[variant],
        sizeClassNames[size],
        className
      )}
      {...props}
    />
  )
}
