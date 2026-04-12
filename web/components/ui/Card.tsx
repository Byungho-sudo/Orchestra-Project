import type { HTMLAttributes } from "react"
import { cn } from "@/lib/ui"

type CardElement = "article" | "div" | "section"
type CardPadding = "none" | "sm" | "md" | "lg"

const paddingClassNames: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-8",
}

export function Card({
  as: Component = "div",
  className,
  padding = "md",
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: CardElement
  padding?: CardPadding
}) {
  return (
    <Component
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-surface-elevated)] shadow-[var(--color-card-shadow)]",
        paddingClassNames[padding],
        className
      )}
      {...props}
    />
  )
}
