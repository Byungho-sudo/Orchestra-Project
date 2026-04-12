"use client"

import { AppShell } from "@/components/layout/AppShell"
import { useCurrentUser } from "@/lib/use-current-user"

export default function TeamPage() {
  const { currentUser, logout } = useCurrentUser()

  return (
    <AppShell title="Team" currentUser={currentUser} onLogout={logout}>
      <main className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Team
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Team Workspace
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Team collaboration tools will live here in a future phase. This page
          is intentionally a placeholder so the app navigation is real and the
          route structure stays clean.
        </p>
      </main>
    </AppShell>
  )
}
