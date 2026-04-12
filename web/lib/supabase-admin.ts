import { createClient } from "@supabase/supabase-js"
import {
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/supabase-config"

export function createSupabaseAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
