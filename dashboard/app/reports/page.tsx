"use client"

import { AppShell } from "@/app/components/project-dashboard/AppShell"
import { useCurrentUser } from "@/lib/use-current-user"

export default function ReportsPage() {
  const { currentUser, logout } = useCurrentUser()

  return (
    <AppShell title="Reports" currentUser={currentUser} onLogout={logout}>
      <main className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Reports
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Reporting Center
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Reporting and analytics features can be added here later. For now,
          this placeholder keeps the app shell and navigation consistent across
          all top-level sections.
        </p>
      </main>
    </AppShell>
  )
}
