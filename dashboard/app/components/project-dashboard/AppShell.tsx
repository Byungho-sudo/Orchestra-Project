"use client"

import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { AppLayout } from "@/app/components/layout/AppLayout"
import { DashboardSidebar } from "@/app/components/project-dashboard/DashboardSidebar"

export function AppShell({
  title,
  currentUser,
  onLogout,
  onCreateProject,
  children,
}: {
  title: string
  currentUser?: User | null
  onLogout?: () => void
  onCreateProject?: () => void
  children: ReactNode
}) {
  return (
    <AppLayout
        title={title}
        currentUser={currentUser}
        onLogout={onLogout}
        onCreateProject={onCreateProject}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <DashboardSidebar />
        {children}
      </div>
    </AppLayout>
  )
}
