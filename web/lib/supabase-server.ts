import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseKey, supabaseUrl } from "@/lib/supabase-config"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot always persist refreshed cookies directly.
        }
      },
    },
  })
}
