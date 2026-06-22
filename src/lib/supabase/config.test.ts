import { describe, expect, test } from "vitest"
import {
  getAuthCallbackUrl,
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
})
