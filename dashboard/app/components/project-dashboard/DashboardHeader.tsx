"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"

export function DashboardHeader({
  title = "Project Dashboard",
  currentUser,
  onLogout,
  onCreateProject,
}: {
  title?: string
  currentUser: User | null
  onLogout: () => void
  onCreateProject?: () => void
}) {
  return (
    <header className="h-16 border-b border-slate-300 bg-slate-50 px-6 shadow-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                {currentUser.email}
              </span>
              <button
                onClick={onLogout}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:underline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Sign up
              </Link>
            </>
          )}

          {onCreateProject && (
            <button
              onClick={onCreateProject}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              New Project
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
