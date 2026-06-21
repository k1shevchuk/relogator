type PublicEnv = Record<string, string | undefined>

type SupabasePublicConfig = {
  isConfigured: boolean
  publishableKey: string
  url: string
}

type RequiredSupabasePublicConfig = {
  publishableKey: string
  url: string
}

const DEFAULT_NEXT_PATH = "/account"

export function getSupabasePublicConfig(
  env: PublicEnv = process.env
): SupabasePublicConfig {
  return getSupabasePublicConfigFromEnv(env)
}

export function getSupabasePublicConfigFromEnv(
  env: PublicEnv = process.env
): SupabasePublicConfig {
  const publishableKey =
    readEnv(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    readEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY")
  const url = readEnv(env, "NEXT_PUBLIC_SUPABASE_URL")

  return {
    isConfigured: isSupabaseConfiguredValue(url, publishableKey),
    publishableKey:
      readEnv(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
      readEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    url,
  }
}

export function requireSupabasePublicConfig(
  env: PublicEnv = process.env
): RequiredSupabasePublicConfig {
  const config = getSupabasePublicConfig(env)

  if (!config.isConfigured) {
    throw new Error(
      `Supabase public env is incomplete: ${getMissingSupabasePublicEnv(
        env
      ).join(", ")}`
    )
  }

  return {
    publishableKey: config.publishableKey,
    url: config.url,
  }
}

export function isSupabaseConfigured(env: PublicEnv = process.env) {
  return getSupabasePublicConfig(env).isConfigured
}

export function getMissingSupabasePublicEnv(env: PublicEnv = process.env) {
  const config = getSupabasePublicConfig(env)
  const missing: string[] = []

  if (!config.url || !isValidHttpUrl(config.url)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!config.publishableKey) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  } else if (isBrowserUnsafeSupabaseKey(config.publishableKey)) {
    missing.push("browser-safe Supabase publishable/anon key")
  }

  return missing
}

export function isBrowserUnsafeSupabaseKey(key: string) {
  const trimmedKey = key.trim()

  if (!trimmedKey) {
    return false
  }

  if (trimmedKey.startsWith("sb_secret_")) {
    return true
  }

  const jwtPayload = readJwtPayload(trimmedKey)

  return jwtPayload?.role === "service_role"
}

export function getAuthCallbackUrl(
  nextPath: string | null | undefined,
  options: {
    env?: PublicEnv
    requestOrigin?: string | null
  } = {}
) {
  const siteUrl = getSiteUrl(options.env ?? process.env, options.requestOrigin)
  const callbackUrl = new URL("/auth/callback", siteUrl)
  callbackUrl.searchParams.set("next", sanitizeNextPath(nextPath))

  return callbackUrl.toString()
}

export function sanitizeNextPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_NEXT_PATH
  }

  const url = new URL(path, "https://relogator.local")

  return `${url.pathname}${url.search}`
}

function getSiteUrl(env: PublicEnv, requestOrigin?: string | null) {
  const rawSiteUrl =
    readEnv(env, "NEXT_PUBLIC_SITE_URL") ||
    requestOrigin?.trim() ||
    "http://localhost:3000"
  const siteUrl = rawSiteUrl.startsWith("http")
    ? rawSiteUrl
    : `https://${rawSiteUrl}`

  return siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`
}

function readEnv(env: PublicEnv, key: string) {
  return env[key]?.trim() ?? ""
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function isSupabaseConfiguredValue(url: string, publishableKey: string) {
  return Boolean(
    url &&
    isValidHttpUrl(url) &&
    publishableKey &&
    !isBrowserUnsafeSupabaseKey(publishableKey)
  )
}

function readJwtPayload(key: string): { role?: string } | null {
  const [, payload] = key.split(".")

  if (!payload) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as { role?: string }
  } catch {
    return null
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  )

  if (typeof atob === "function") {
    return atob(padded)
  }

  return Buffer.from(padded, "base64").toString("utf8")
}
