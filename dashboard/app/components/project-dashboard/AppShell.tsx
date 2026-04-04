"use client"

import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { DashboardHeader } from "@/app/components/project-dashboard/DashboardHeader"
import { DashboardSidebar } from "@/app/components/project-dashboard/DashboardSidebar"
import { useCurrentUser } from "@/lib/use-current-user"

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
  const { currentUser: fallbackCurrentUser, logout } = useCurrentUser()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardHeader
        title={title}
        currentUser={currentUser ?? fallbackCurrentUser}
        onLogout={onLogout ?? logout}
        onCreateProject={onCreateProject}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-[240px_1fr]">
        <DashboardSidebar />
        {children}
      </div>
    </div>
  )
}
