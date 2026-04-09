import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { isGuestAllowedPath } from "@/lib/auth/guest-route-access"
import { supabaseKey, supabaseUrl } from "@/lib/supabase-config"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )

    const redirectResponse = NextResponse.redirect(loginUrl)

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })

    return redirectResponse
  }

  const { data: guestUser } = await supabase
    .from("guest_users")
    .select("status")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ status: "active" | "revoked" }>()

  if (guestUser?.status === "revoked") {
    return NextResponse.redirect(new URL("/guest?revoked=1", request.url))
  }

  if (user.is_anonymous && !guestUser) {
    return NextResponse.redirect(new URL("/guest", request.url))
  }

  if (guestUser?.status === "active" && !isGuestAllowedPath(pathname)) {
    return NextResponse.redirect(new URL("/projects", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard",
    "/projects/:path*",
    "/settings/:path*",
    "/team",
    "/tickets",
  ],
}
