import {
  countries as localCountries,
  routes as localRoutes,
  sources as localSources,
} from "./data-catalog"
import type {
  ConfidenceLevel,
  CostLevel,
  Country,
  CountryResearchStatus,
  DifficultyLevel,
  PublicationStatus,
  RelocationGoal,
  RouteDefinition,
  RouteSource,
  SourceType,
  StayDuration,
} from "./types"

export type ContentCatalogue = {
  countries: Country[]
  sources: RouteSource[]
  routes: RouteDefinition[]
}

export type ContentCountryRow = {
  code: string
  name: string
  slug: string
  status: string
  summary: string
  source_ids: string[]
  last_reviewed_at: string
}

export type ContentSourceRow = {
  id: string
  title: string
  url: string
  source_type: string
  country_code: string
  language: string
  last_reviewed_at: string
  description: string
  confidence: string
  applies_to_citizenship: string[]
}

export type ContentRouteRow = {
  id: string
  country_code: string
  title: string
  short_description: string
  entry_type: string
  goals: string[]
  stay_durations: string[]
  publication_status: string
  confidence: string
  last_reviewed_at: string
  base_difficulty: number
  requirements: unknown
  supports: unknown
  timeline: unknown
  cost: unknown
  documents: string[]
  source_ids: string[]
  steps: unknown
  risks: string[]
}

export type ContentCatalogueRows = {
  countries: ContentCountryRow[]
  sources: ContentSourceRow[]
  routes: ContentRouteRow[]
}

export const localContentCatalogue: ContentCatalogue = {
  countries: localCountries,
  sources: localSources,
  routes: localRoutes,
}

export function buildContentCatalogueFromRows(
  rows: ContentCatalogueRows
): ContentCatalogue {
  const countries = rows.countries.map(contentCountryRowToCountry)
  const sources = rows.sources.map(contentSourceRowToSource)
  const routes = rows.routes.map(contentRouteRowToRoute)

  assertCatalogueReferences({ countries, sources, routes })

  return {
    countries,
    sources,
    routes,
  }
}

export function contentCountryRowToCountry(row: ContentCountryRow): Country {
  return {
    code: row.code,
    name: row.name,
    slug: row.slug,
    status: row.status as CountryResearchStatus,
    summary: row.summary,
    sourceIds: row.source_ids,
    lastReviewedAt: row.last_reviewed_at,
  }
}

export function contentSourceRowToSource(row: ContentSourceRow): RouteSource {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    sourceType: row.source_type as SourceType,
    countryCode: row.country_code,
    language: row.language as RouteSource["language"],
    lastReviewedAt: row.last_reviewed_at,
    description: row.description,
    confidence: row.confidence as ConfidenceLevel,
    appliesToCitizenship: row.applies_to_citizenship as ["RU"],
  }
}

export function contentRouteRowToRoute(row: ContentRouteRow): RouteDefinition {
  return {
    id: row.id,
    countryCode: row.country_code,
    title: row.title,
    shortDescription: row.short_description,
    entryType: row.entry_type as RouteDefinition["entryType"],
    goals: row.goals as RelocationGoal[],
    stayDurations: row.stay_durations as StayDuration[],
    publicationStatus: row.publication_status as PublicationStatus,
    confidence: row.confidence as ConfidenceLevel,
    lastReviewedAt: row.last_reviewed_at,
    baseDifficulty: row.base_difficulty as DifficultyLevel,
    requirements: readRequirements(row.requirements),
    supports: readSupports(row.supports),
    timeline: readTimeline(row.timeline),
    cost: readCost(row.cost),
    documents: row.documents,
    sourceIds: row.source_ids,
    steps: readSteps(row.steps),
    risks: row.risks,
  }
}

export function getRouteFromCatalogue(
  catalogue: ContentCatalogue,
  routeId: string
): RouteDefinition | undefined {
  return catalogue.routes.find((route) => route.id === routeId)
}

export function getCountryFromCatalogue(
  catalogue: ContentCatalogue,
  code: Country["code"]
): Country {
  const country = catalogue.countries.find((item) => item.code === code)

  if (!country) {
    throw new Error(`Unknown country code: ${code}`)
  }

  return country
}

export function getSourcesFromCatalogue(
  catalogue: ContentCatalogue,
  sourceIds: string[]
): RouteSource[] {
  return sourceIds
    .map((sourceId) =>
      catalogue.sources.find((source) => source.id === sourceId)
    )
    .filter((source): source is RouteSource => Boolean(source))
}

function assertCatalogueReferences(catalogue: ContentCatalogue): void {
  const countryCodes = new Set(
    catalogue.countries.map((country) => country.code)
  )
  const sourceIds = new Set(catalogue.sources.map((source) => source.id))

  if (countryCodes.size === 0 || sourceIds.size === 0) {
    throw new Error("Content catalogue is empty")
  }

  for (const source of catalogue.sources) {
    if (!countryCodes.has(source.countryCode)) {
      throw new Error(
        `Unknown country ${source.countryCode} in source ${source.id}`
      )
    }
  }

  for (const country of catalogue.countries) {
    for (const sourceId of country.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`Unknown source ${sourceId} in country ${country.code}`)
      }
    }
  }

  for (const route of catalogue.routes) {
    if (!countryCodes.has(route.countryCode)) {
      throw new Error(
        `Unknown country ${route.countryCode} in route ${route.id}`
      )
    }

    for (const sourceId of route.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`Unknown source ${sourceId} in route ${route.id}`)
      }
    }
  }
}

function readRequirements(value: unknown): RouteDefinition["requirements"] {
  return readRecord(value) as RouteDefinition["requirements"]
}

function readSupports(value: unknown): RouteDefinition["supports"] {
  return readRecord(value) as RouteDefinition["supports"]
}

function readTimeline(value: unknown): RouteDefinition["timeline"] {
  return readRecord(value) as RouteDefinition["timeline"]
}

function readCost(value: unknown): RouteDefinition["cost"] {
  return readRecord(value) as { level: CostLevel; label: string }
}

function readSteps(value: unknown): RouteDefinition["steps"] {
  if (!Array.isArray(value)) {
    throw new Error("Route steps must be an array")
  }

  return value as RouteDefinition["steps"]
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Content catalogue JSON field must be an object")
  }

  return value as Record<string, unknown>
}
