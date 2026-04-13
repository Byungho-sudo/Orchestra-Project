import type { ReactNode } from "react"

export function ProjectsPageFrame({
  toolbar,
  children,
}: {
  toolbar: ReactNode
  children: ReactNode
}) {
  return (
    <main className="space-y-4">
      {toolbar}
      {children}
    </main>
  )
}

export function ProjectsCardsGrid({
  children,
}: {
  children: ReactNode
}) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
}
