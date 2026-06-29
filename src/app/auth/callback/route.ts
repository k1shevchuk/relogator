import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { isSupabaseConfigured, sanitizeNextPath } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const supportedOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
])

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const otpType = parseOtpType(requestUrl.searchParams.get("type"))
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"))
  const redirectUrl = new URL(nextPath, requestUrl.origin)

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent("Вход временно недоступен")}`,
        requestUrl.origin
      )
    )
  }

  if (!code && (!tokenHash || !otpType)) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent("Ссылка входа недействительна")}`,
        requestUrl.origin
      )
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } =
    tokenHash && otpType
      ? await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        })
      : await supabase.auth.exchangeCodeForSession(code!)

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

function parseOtpType(value: string | null): EmailOtpType | null {
  if (!value || !supportedOtpTypes.has(value as EmailOtpType)) {
    return null
  }

  return value as EmailOtpType
}
