import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import {
  getSupabasePublicConfig,
  requireSupabasePublicConfig,
} from "@/lib/supabase/config"
import type { Database } from "@/lib/supabase/database.types"

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig().isConfigured
}

export async function createSupabaseServerClient() {
  const { url, publishableKey } = requireSupabasePublicConfig()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, publishableKey, {
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
          // Server Components cannot always set cookies. The proxy refreshes
          // sessions before render, so this is expected in read-only contexts.
        }
      },
    },
  })
}

export async function getCurrentSupabaseUser() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
