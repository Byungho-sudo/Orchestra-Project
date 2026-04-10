export function isGuestAllowedPath(pathname: string) {
  return (
    pathname === "/projects" ||
    pathname.startsWith("/projects/") ||
    pathname === "/tickets"
  )
}

export function isProtectedPath(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/team" ||
    pathname === "/tickets"
  )
}
