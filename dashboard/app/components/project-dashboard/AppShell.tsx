"use client"

import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { DashboardHeader } from "@/app/components/project-dashboard/DashboardHeader"
import { DashboardSidebar } from "@/app/components/project-dashboard/DashboardSidebar"

export function AppShell({
  title,
  currentUser,
  onLogout,
  onCreateProject,
  children,
}: {
  title: string
  currentUser: User | null
  onLogout: () => void
  onCreateProject?: () => void
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardHeader
        title={title}
        currentUser={currentUser}
        onLogout={onLogout}
        onCreateProject={onCreateProject}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-[240px_1fr]">
        <DashboardSidebar />
        {children}
      </div>
    </div>
  )
}
