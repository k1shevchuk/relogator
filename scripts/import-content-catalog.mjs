import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"

const rootDir = process.cwd()

loadDotenv(".env")
loadDotenv(".env.local")

const isDryRun = process.argv.includes("--dry-run")
const supabaseAccessToken = readEnv("SUPABASE_ACCESS_TOKEN")
const supabaseProjectRef = readEnv("SUPABASE_PROJECT_REF")
const rows = buildRows()

if (isDryRun) {
  console.log(
    `Prepared ${rows.countries.length} countries, ${rows.sources.length} sources, ${rows.routes.length} routes.`
  )
  process.exit(0)
}

let supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL")
let supabaseServerKey =
  readEnv("SUPABASE_SERVICE_ROLE_KEY") ||
  readEnv("SUPABASE_SECRET_KEY") ||
  readEnv("SUPABASE_SERVICE_KEY")

if (!supabaseUrl && supabaseProjectRef) {
  supabaseUrl = `https://${supabaseProjectRef}.supabase.co`
}

if (!supabaseServerKey && supabaseAccessToken && supabaseProjectRef) {
  supabaseServerKey = await readServiceRoleKey(
    supabaseAccessToken,
    supabaseProjectRef
  )
}

if (!supabaseUrl || !supabaseServerKey) {
  throw new Error(
    "Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY или SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF в .env"
  )
}

await upsertRows("content_countries", rows.countries, "code")
await upsertRows("content_sources", rows.sources, "id")
await upsertRows("content_routes", rows.routes, "id", 1)

console.log(
  `Imported ${rows.countries.length} countries, ${rows.sources.length} sources, ${rows.routes.length} routes.`
)

async function upsertRows(tableName, tableRows, onConflict, batchSize = 50) {
  if (tableRows.length === 0) {
    return
  }

  for (let index = 0; index < tableRows.length; index += batchSize) {
    const batch = tableRows.slice(index, index + batchSize)
    const error = await upsertBatch(tableName, batch, onConflict)

    if (error) {
      throw new Error(`${tableName}: ${error.message}`)
    }

    console.log(
      `${tableName}: ${Math.min(index + batch.length, tableRows.length)}/${tableRows.length}`
    )
  }
}

async function upsertBatch(tableName, batch, onConflict) {
  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const error = await upsertBatchViaRest(tableName, batch, onConflict)

    if (!error) {
      return null
    }

    lastError = error
    await sleep(attempt * 1000)
  }

  return lastError
}

async function upsertBatchViaRest(tableName, batch, onConflict) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${tableName}?on_conflict=${encodeURIComponent(onConflict)}`

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: supabaseServerKey,
        authorization: `Bearer ${supabaseServerKey}`,
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
      signal: controller.signal,
    })

    if (response.ok) {
      return null
    }

    return new Error(
      `HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`
    )
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  } finally {
    clearTimeout(timeout)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readServiceRoleKey(accessToken, projectRef) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(
      `Не удалось получить ключи Supabase: HTTP ${response.status}`
    )
  }

  const keys = await response.json()
  const serviceRoleKey = keys.find(
    (key) => key.name === "service_role"
  )?.api_key

  if (!serviceRoleKey) {
    throw new Error("В проекте Supabase не найден ключ service_role")
  }

  return serviceRoleKey
}

function buildRows() {
  const manifest = readJson("data/catalog.json")
  const requirements = readJson("data/requirements/index.json")
  const documents = readJson("data/documents/index.json")
  const requirementById = new Map(
    requirements.map((requirement) => [requirement.id, requirement])
  )
  const documentById = new Map(
    documents.map((document) => [document.id, document])
  )

  const countries = manifest.currentCountryCodes.map((countryCode) =>
    countryToRow(readJson(`data/countries/${countryCode}.json`))
  )
  const sources = manifest.currentCountryCodes.flatMap((countryCode) =>
    readJson(`data/sources/${countryCode}.json`).map(sourceToRow)
  )
  const routes = manifest.currentCountryCodes.flatMap((countryCode) =>
    readJson(`data/routes/${countryCode}.json`).map((route) =>
      routeToRow(route, requirementById, documentById)
    )
  )

  return {
    countries,
    sources,
    routes,
  }
}

function countryToRow(country) {
  return {
    code: country.code,
    name: country.name,
    slug: country.slug,
    status: country.status,
    summary: country.summary,
    source_ids: country.sourceIds,
    last_reviewed_at: country.lastReviewedAt,
  }
}

function sourceToRow(source) {
  return {
    id: source.id,
    title: source.title,
    url: source.url,
    source_type: source.sourceType,
    country_code: source.countryCode,
    language: source.language,
    last_reviewed_at: source.lastReviewedAt,
    description: source.description,
    confidence: source.confidence,
    applies_to_citizenship: source.appliesToCitizenship,
  }
}

function routeToRow(route, requirementById, documentById) {
  const requirements = route.requirementIds.reduce(
    (result, requirementId) => {
      const requirement = requirementById.get(requirementId)

      if (!requirement) {
        throw new Error(`Unknown requirement ${requirementId} in ${route.id}`)
      }

      return {
        ...result,
        ...requirement.config,
      }
    },
    { minPassportMonths: 0 }
  )
  const documents = route.documentIds.map((documentId) => {
    const document = documentById.get(documentId)

    if (!document) {
      throw new Error(`Unknown document ${documentId} in ${route.id}`)
    }

    return document.title
  })

  return {
    id: route.id,
    country_code: route.countryCode,
    title: route.title,
    short_description: route.shortDescription,
    entry_type: route.entryType,
    goals: route.goals,
    stay_durations: route.stayDurations,
    publication_status: route.publicationStatus,
    confidence: route.confidence,
    last_reviewed_at: route.lastReviewedAt,
    base_difficulty: route.baseDifficulty,
    requirements,
    supports: route.supports,
    timeline: route.timeline,
    cost: route.cost,
    documents,
    source_ids: route.sourceIds,
    steps: route.steps,
    risks: route.risks,
    decision_graph: {
      version: 1,
      routeId: route.id,
      countryCode: route.countryCode,
      questionnaireFields: [
        "goal",
        "stayDuration",
        "passportStatus",
        "hasProvableIncome",
        "monthlyIncomeLevel",
        "savingsLevel",
        "hasEmploymentContract",
        "hasBusiness",
        "willingToOpenCompany",
        "translationReadiness",
        "hasCriminalRecordCertificate",
        "companions",
      ],
      requirementKeys: Object.keys(requirements),
    },
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(rootDir, relativePath), "utf8"))
}

function readEnv(key) {
  return process.env[key]?.trim() ?? ""
}

function loadDotenv(relativePath) {
  const filePath = join(rootDir, relativePath)

  if (!existsSync(filePath)) {
    return
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/)

    if (!match || process.env[match[1]]) {
      continue
    }

    process.env[match[1]] = stripQuotes(match[2].trim())
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}
