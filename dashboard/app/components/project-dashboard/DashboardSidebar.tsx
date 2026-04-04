"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navigationLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/reports", label: "Reports" },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Sidebar
      </h2>

      <nav className="space-y-2 text-sm">
        {navigationLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 ${
                isActive
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
