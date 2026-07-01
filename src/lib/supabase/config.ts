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
const DEFAULT_LOCAL_SITE_URL = "http://localhost:3000/"
const PRODUCTION_SITE_URL = "https://relogator.ru/"

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
  return getAuthRouteUrl("/auth/callback", nextPath, options)
}

export function getAuthEmailCallbackUrl(
  nextPath: string | null | undefined,
  options: {
    env?: PublicEnv
    requestOrigin?: string | null
  } = {}
) {
  return getAuthRouteUrl("/auth/callback", nextPath, {
    ...options,
    preferPublicSite: true,
  })
}

export function getAuthConfirmUrl(
  nextPath: string | null | undefined,
  options: {
    env?: PublicEnv
    requestOrigin?: string | null
  } = {}
) {
  return getAuthRouteUrl("/auth/confirm", nextPath, options)
}

export function getAuthEmailConfirmUrl(
  nextPath: string | null | undefined,
  options: {
    env?: PublicEnv
    requestOrigin?: string | null
  } = {}
) {
  return getAuthRouteUrl("/auth/confirm", nextPath, {
    ...options,
    preferPublicSite: true,
  })
}

export function getAuthEmailSiteUrl(
  env: PublicEnv = process.env,
  requestOrigin?: string | null
) {
  return getPublicEmailSiteUrl(env, requestOrigin)
}

function getAuthRouteUrl(
  routePath: "/auth/callback" | "/auth/confirm",
  nextPath: string | null | undefined,
  options: {
    env?: PublicEnv
    preferPublicSite?: boolean
    requestOrigin?: string | null
  }
) {
  const siteUrl = options.preferPublicSite
    ? getPublicEmailSiteUrl(options.env ?? process.env, options.requestOrigin)
    : getSiteUrl(options.env ?? process.env, options.requestOrigin)
  const callbackUrl = new URL(routePath, siteUrl)
  callbackUrl.searchParams.set("next", sanitizeNextPath(nextPath))

  return callbackUrl.toString()
}

export function getPublicSiteUrl(
  env: PublicEnv = process.env,
  requestOrigin?: string | null
) {
  return getSiteUrl(env, requestOrigin)
}

export function getRequestOriginFromHeaders(
  headers: Pick<Headers, "get">
): string | null {
  const originUrl = normalizeSiteUrl(headers.get("origin"))

  if (originUrl && !isLocalSiteUrl(originUrl)) {
    return originUrl
  }

  const forwardedHost = readFirstForwardedValue(headers.get("x-forwarded-host"))
  const forwardedProto =
    readFirstForwardedValue(headers.get("x-forwarded-proto")) ?? "https"

  if (forwardedHost) {
    return normalizeSiteUrl(`${forwardedProto}://${forwardedHost}`)
  }

  const host = readFirstForwardedValue(headers.get("host"))

  if (host) {
    const protocol = readFirstForwardedValue(headers.get("x-forwarded-proto"))

    return normalizeSiteUrl(`${protocol ?? "http"}://${host}`)
  }

  return originUrl || null
}

export function sanitizeNextPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_NEXT_PATH
  }

  const url = new URL(path, "https://relogator.local")

  return `${url.pathname}${url.search}`
}

function getSiteUrl(env: PublicEnv, requestOrigin?: string | null) {
  const envSiteUrl = normalizeSiteUrl(readEnv(env, "NEXT_PUBLIC_SITE_URL"))
  const requestOriginUrl = normalizeSiteUrl(requestOrigin)
  const isProduction = readEnv(env, "NODE_ENV") === "production"

  if (requestOriginUrl && (!envSiteUrl || isLocalSiteUrl(envSiteUrl))) {
    if (isProduction && isLocalSiteUrl(requestOriginUrl)) {
      return PRODUCTION_SITE_URL
    }

    return requestOriginUrl
  }

  if (envSiteUrl) {
    if (isProduction && isLocalSiteUrl(envSiteUrl)) {
      return PRODUCTION_SITE_URL
    }

    return envSiteUrl
  }

  if (requestOriginUrl) {
    if (isProduction && isLocalSiteUrl(requestOriginUrl)) {
      return PRODUCTION_SITE_URL
    }

    return requestOriginUrl
  }

  return isProduction ? PRODUCTION_SITE_URL : DEFAULT_LOCAL_SITE_URL
}

function getPublicEmailSiteUrl(
  env: PublicEnv,
  requestOrigin?: string | null
) {
  const emailSiteUrl = normalizeSiteUrl(
    readEnv(env, "AUTH_EMAIL_SITE_URL") ||
      readEnv(env, "NEXT_PUBLIC_AUTH_EMAIL_SITE_URL")
  )

  if (emailSiteUrl && !isLocalSiteUrl(emailSiteUrl)) {
    return emailSiteUrl
  }

  const envSiteUrl = normalizeSiteUrl(readEnv(env, "NEXT_PUBLIC_SITE_URL"))

  if (envSiteUrl && !isLocalSiteUrl(envSiteUrl)) {
    return envSiteUrl
  }

  const requestOriginUrl = normalizeSiteUrl(requestOrigin)
  const allowLocalEmailRedirects =
    readEnv(env, "ALLOW_LOCAL_AUTH_EMAIL_REDIRECTS") === "true"

  if (
    allowLocalEmailRedirects &&
    requestOriginUrl &&
    isLocalSiteUrl(requestOriginUrl)
  ) {
    return requestOriginUrl
  }

  return PRODUCTION_SITE_URL
}

function normalizeSiteUrl(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ""
  }

  const siteUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`

  return siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`
}

function isLocalSiteUrl(value: string) {
  try {
    const url = new URL(value)

    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]"
    )
  } catch {
    return false
  }
}

function readEnv(env: PublicEnv, key: string) {
  return env[key]?.trim() ?? ""
}

function readFirstForwardedValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() || null
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
