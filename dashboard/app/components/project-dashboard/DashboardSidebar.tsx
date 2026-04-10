"use client"

import { usePathname } from "next/navigation"
import { Sidebar, SidebarItem } from "@/app/components/layout/Sidebar"
import { useAppActor } from "@/lib/auth/use-app-actor"
import { useCurrentUser } from "@/lib/use-current-user"

const navigationLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/tickets", label: "Tickets" },
]

const guestNavigationHrefs = new Set(["/projects", "/tickets"])

export function DashboardSidebar() {
  const pathname = usePathname()
  const { currentUser } = useCurrentUser()
  const { actor } = useAppActor(currentUser)
  const visibleNavigationLinks =
    actor?.kind === "guest"
      ? navigationLinks.filter((link) => guestNavigationHrefs.has(link.href))
      : navigationLinks

  return (
    <Sidebar title="Navigation">
      <nav className="space-y-2 text-sm">
        {visibleNavigationLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <SidebarItem
              key={link.href}
              href={link.href}
              isActive={isActive}
            >
              {link.label}
            </SidebarItem>
          )
        })}
      </nav>
    </Sidebar>
  )
}
