import { describe, expect, test } from "vitest"
import {
  getAuthCallbackUrl,
  getAuthConfirmUrl,
  getAuthEmailCallbackUrl,
  getAuthEmailConfirmUrl,
  getAuthEmailSiteUrl,
  getPublicSiteUrl,
  getRequestOriginFromHeaders,
  getSupabasePublicConfigFromEnv,
  isBrowserUnsafeSupabaseKey,
} from "./config"

describe("Supabase public config", () => {
  test("reports missing config instead of throwing during static rendering", () => {
    const config = getSupabasePublicConfigFromEnv({})

    expect(config.isConfigured).toBe(false)
    expect(config.url).toBe("")
    expect(config.publishableKey).toBe("")
  })

  test("uses the official publishable key variable", () => {
    const config = getSupabasePublicConfigFromEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_key",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy_anon_key",
    })

    expect(config.isConfigured).toBe(true)
    expect(config.publishableKey).toBe("sb_publishable_key")
  })

  test("keeps a legacy anon key fallback for existing local env files", () => {
    const config = getSupabasePublicConfigFromEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy_anon_key",
    })

    expect(config.isConfigured).toBe(true)
    expect(config.publishableKey).toBe("legacy_anon_key")
  })

  test("rejects service role and secret keys for browser config", () => {
    const legacyServiceRoleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature"
    const config = getSupabasePublicConfigFromEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacyServiceRoleJwt,
    })

    expect(isBrowserUnsafeSupabaseKey("sb_secret_live")).toBe(true)
    expect(isBrowserUnsafeSupabaseKey(legacyServiceRoleJwt)).toBe(true)
    expect(config.isConfigured).toBe(false)
  })

  test("builds auth callback urls with local next paths only", () => {
    const safeUrl = getAuthCallbackUrl("/account?confirmed=1", {
      env: { NEXT_PUBLIC_SITE_URL: "https://relogator.example" },
    })
    const unsafeUrl = getAuthCallbackUrl("https://evil.example/phish", {
      env: { NEXT_PUBLIC_SITE_URL: "https://relogator.example" },
    })

    expect(safeUrl).toBe(
      "https://relogator.example/auth/callback?next=%2Faccount%3Fconfirmed%3D1"
    )
    expect(unsafeUrl).toBe(
      "https://relogator.example/auth/callback?next=%2Faccount"
    )
  })

  test("builds auth confirmation urls with local next paths only", () => {
    const confirmUrl = getAuthConfirmUrl("/account?confirmed=1", {
      env: { NEXT_PUBLIC_SITE_URL: "https://relogator.example" },
    })

    expect(confirmUrl).toBe(
      "https://relogator.example/auth/confirm?next=%2Faccount%3Fconfirmed%3D1"
    )
  })

  test("uses the current request origin when the configured site url is local", () => {
    const callbackUrl = getAuthCallbackUrl("/auth/login", {
      env: { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
      requestOrigin: "http://127.0.0.1:3100",
    })

    expect(callbackUrl).toBe(
      "http://127.0.0.1:3100/auth/callback?next=%2Fauth%2Flogin"
    )
  })

  test("keeps the configured production site url over the request origin", () => {
    const callbackUrl = getAuthCallbackUrl("/auth/login", {
      env: { NEXT_PUBLIC_SITE_URL: "https://relogator.ru" },
      requestOrigin: "http://127.0.0.1:3100",
    })

    expect(callbackUrl).toBe(
      "https://relogator.ru/auth/callback?next=%2Fauth%2Flogin"
    )
  })

  test("uses configured production site url for server redirects behind proxy", () => {
    const siteUrl = getPublicSiteUrl(
      { NEXT_PUBLIC_SITE_URL: "https://relogator.ru" },
      "https://localhost:3000"
    )

    expect(siteUrl).toBe("https://relogator.ru/")
  })

  test("does not build local auth links in production without a public site url", () => {
    const confirmUrl = getAuthConfirmUrl("/account?confirmed=1", {
      env: { NODE_ENV: "production" },
      requestOrigin: "http://localhost:3000",
    })

    expect(confirmUrl).toBe(
      "https://relogator.ru/auth/confirm?next=%2Faccount%3Fconfirmed%3D1"
    )
  })

  test("does not keep a local configured site url in production auth links", () => {
    const callbackUrl = getAuthCallbackUrl("/auth/new-password", {
      env: {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NODE_ENV: "production",
      },
      requestOrigin: "http://127.0.0.1:3000",
    })

    expect(callbackUrl).toBe(
      "https://relogator.ru/auth/callback?next=%2Fauth%2Fnew-password"
    )
  })

  test("keeps email confirmation links on the public site by default", () => {
    const confirmUrl = getAuthEmailConfirmUrl("/account?confirmed=1", {
      env: { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
      requestOrigin: "http://127.0.0.1:3000",
    })
    const resetUrl = getAuthEmailCallbackUrl("/auth/new-password", {
      env: { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
      requestOrigin: "http://127.0.0.1:3000",
    })

    expect(confirmUrl).toBe(
      "https://relogator.ru/auth/confirm?next=%2Faccount%3Fconfirmed%3D1"
    )
    expect(resetUrl).toBe(
      "https://relogator.ru/auth/callback?next=%2Fauth%2Fnew-password"
    )
  })

  test("allows local email redirects only when explicitly enabled", () => {
    const confirmUrl = getAuthEmailConfirmUrl("/account?confirmed=1", {
      env: {
        ALLOW_LOCAL_AUTH_EMAIL_REDIRECTS: "true",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      },
      requestOrigin: "http://127.0.0.1:3100",
    })

    expect(confirmUrl).toBe(
      "http://127.0.0.1:3100/auth/confirm?next=%2Faccount%3Fconfirmed%3D1"
    )
  })

  test("uses explicit auth email site url before other public site urls", () => {
    const siteUrl = getAuthEmailSiteUrl(
      {
        AUTH_EMAIL_SITE_URL: "https://auth.relogator.example",
        NEXT_PUBLIC_SITE_URL: "https://relogator.example",
      },
      "http://127.0.0.1:3000"
    )

    expect(siteUrl).toBe("https://auth.relogator.example/")
  })

  test("builds request origin from forwarded proxy headers", () => {
    const headers = new Headers({
      host: "127.0.0.1:3000",
      "x-forwarded-host": "relogator.ru",
      "x-forwarded-proto": "https",
    })

    expect(getRequestOriginFromHeaders(headers)).toBe("https://relogator.ru/")
  })
})
