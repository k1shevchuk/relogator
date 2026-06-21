import { NextResponse } from "next/server"

import { isSupabaseConfigured, sanitizeNextPath } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"))
  const redirectUrl = new URL(nextPath, requestUrl.origin)

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent("Supabase не настроен")}`,
        requestUrl.origin
      )
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent("Ссылка входа недействительна")}`,
        requestUrl.origin
      )
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error.message)}`,
        requestUrl.origin
      )
    )
  }

  return NextResponse.redirect(redirectUrl)
}
