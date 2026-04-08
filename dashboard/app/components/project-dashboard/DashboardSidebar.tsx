"use client"

import { usePathname } from "next/navigation"
import { Sidebar, SidebarItem } from "@/app/components/layout/Sidebar"

const navigationLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/tickets", label: "Tickets" },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar title="Navigation">
      <nav className="space-y-2 text-sm">
        {navigationLinks.map((link) => {
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
