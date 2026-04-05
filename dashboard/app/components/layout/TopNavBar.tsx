"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"

export function TopNavBar({
  breadcrumb,
  title = "Orchestra",
  currentUser,
  onLogout,
}: {
  breadcrumb?: {
    current: string
    href: string
    label: string
  }
  title?: string
  currentUser: User | null
  onLogout?: () => void
}) {
  return (
    <header className="sticky top-0 z-50 h-[var(--header-height)] border-b border-slate-300 bg-slate-50 px-6 shadow-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0">
          {breadcrumb ? (
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-lg font-semibold text-slate-900"
            >
              <Link
                href={breadcrumb.href}
                className="truncate text-slate-700 transition-colors hover:text-slate-900"
              >
                {breadcrumb.label}
              </Link>
              <span className="text-slate-300">/</span>
              <span className="truncate text-slate-900">{breadcrumb.current}</span>
            </nav>
          ) : (
            <p className="truncate text-lg font-semibold text-slate-900">
              {title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                {currentUser.email}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Log out
                </button>
              )}
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
        </div>
      </div>
    </header>
  )
}
