import type { HTMLAttributes } from "react"
import { cn } from "@/lib/ui"

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger" | "info"

const variantClassNames: Record<BadgeVariant, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  brand: "border-indigo-200 bg-indigo-50 text-indigo-700",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
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
