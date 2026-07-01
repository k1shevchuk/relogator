import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import {
  getAuthEmailSiteUrl,
  isSupabaseConfigured,
  sanitizeNextPath,
} from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { toPublicAuthLinkErrorMessage } from "@/features/auth/auth-errors"

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
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const otpType = parseOtpType(requestUrl.searchParams.get("type"))
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"))
  const publicSiteUrl = getAuthEmailSiteUrl(process.env, requestUrl.origin)

  if (!isSupabaseConfigured()) {
    return redirectToLogin("Вход временно недоступен", publicSiteUrl)
  }

  if (!tokenHash || !otpType) {
    return redirectToLogin(
      "Ссылка подтверждения недействительна",
      publicSiteUrl
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: otpType,
  })

  if (error) {
    return redirectToLogin(
      toPublicAuthLinkErrorMessage(error.message),
      publicSiteUrl
    )
  }

  return NextResponse.redirect(new URL(nextPath, publicSiteUrl))
}

function parseOtpType(value: string | null): EmailOtpType | null {
  if (!value || !supportedOtpTypes.has(value as EmailOtpType)) {
    return null
  }

  return value as EmailOtpType
}

function redirectToLogin(message: string, publicSiteUrl: string) {
  const loginUrl = new URL("/auth/login", publicSiteUrl)
  loginUrl.searchParams.set("error", message)

  return NextResponse.redirect(loginUrl)
}
