"use client"

import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/AppLayout"
import { DashboardSidebar } from "@/app/components/project-dashboard/DashboardSidebar"

export function AppShell({
  title,
  currentUser,
  onLogout,
  children,
}: {
  title: string
  currentUser?: User | null
  onLogout?: () => void
  children: ReactNode
}) {
  return (
    <AppLayout title={title} currentUser={currentUser} onLogout={onLogout}>
      <div className="grid grid-cols-1 gap-[var(--layout-gap)] md:grid-cols-[240px_1fr]">
        <div className="hidden md:block md:sticky md:top-[var(--sticky-panel-top)] md:self-start md:h-fit">
          <DashboardSidebar />
        </div>
        {children}
      </div>
    </AppLayout>
  )
}
