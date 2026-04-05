"use client"

import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { useCurrentUser } from "@/lib/use-current-user"
import { TopNavBar } from "./TopNavBar"

export function AppLayout({
  breadcrumb,
  title,
  currentUser,
  onLogout,
  onCreateProject,
  children,
}: {
  breadcrumb?: {
    current: string
    href: string
    label: string
  }
  title: string
  currentUser?: User | null
  onLogout?: () => void
  onCreateProject?: () => void
  children: ReactNode
}) {
  const { currentUser: fallbackCurrentUser, logout } = useCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <TopNavBar
        breadcrumb={breadcrumb}
        title={title}
        currentUser={currentUser ?? fallbackCurrentUser}
        onLogout={onLogout ?? logout}
        onCreateProject={onCreateProject}
      />

      <main className="mx-auto max-w-7xl px-6 pb-6 pt-8">{children}</main>
    </div>
  )
}
