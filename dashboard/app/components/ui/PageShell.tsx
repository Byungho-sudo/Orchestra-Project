import type { ReactNode } from "react"
import { cn } from "@/lib/ui"

export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <main className={cn("space-y-6", className)}>{children}</main>
}
