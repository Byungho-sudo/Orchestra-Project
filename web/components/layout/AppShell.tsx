"use client"

import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/AppLayout"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import type { ThemeConfig } from "@/lib/theme"

export function AppShell({
  title,
  currentUser,
  onLogout,
  theme,
  rootClassName,
  children,
}: {
  title: string
  currentUser?: User | null
  onLogout?: () => void
  theme?: ThemeConfig
  rootClassName?: string
  children: ReactNode
}) {
  return (
    <AppLayout
      title={title}
      currentUser={currentUser}
      onLogout={onLogout}
      theme={theme}
      rootClassName={rootClassName}
    >
      <div className="grid grid-cols-1 gap-[var(--layout-gap)] md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden md:block md:sticky md:top-[var(--sticky-panel-top)] md:self-start md:h-fit">
          <DashboardSidebar />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </AppLayout>
  )
}
