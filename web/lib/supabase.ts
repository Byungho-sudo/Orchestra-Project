import { createBrowserClient } from "@supabase/ssr"
import { supabaseKey, supabaseUrl } from "@/lib/supabase-config"

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseKey
)
