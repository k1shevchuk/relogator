import { z } from "zod"

const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/)
const reviewedDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const confidenceLevelSchema = z.enum(["low", "medium", "high"])
export const publicationStatusSchema = z.enum([
  "draft",
  "reviewed",
  "partner_reviewed",
  "stale",
  "archived",
])
export const countryResearchStatusSchema = z.enum([
  "reviewed",
  "needs_review",
  "stale",
  "reference_only",
])
export const sourceTypeSchema = z.enum([
  "official_body",
  "consulate",
  "law",
  "statistics",
  "government_portal",
  "partner",
  "editorial_note",
])
export const relocationGoalSchema = z.enum([
  "quick_exit",
  "medium_stay",
  "residence",
  "remote_work",
  "local_work",
  "business",
  "family",
  "compare",
])
export const stayDurationSchema = z.enum([
  "up_to_one_month",
  "one_to_three_months",
  "three_to_six_months",
  "six_to_twelve_months",
  "more_than_year",
  "permanent_status",
])
export const monthlyIncomeLevelSchema = z.enum([
  "none",
  "under_one_thousand",
  "one_to_three_thousand",
  "three_thousand_plus",
])
export const moneyLevelSchema = z.enum(["none", "low", "medium", "high"])
export const difficultyLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
export const costLevelSchema = z.enum(["low", "medium", "high"])
export const assessmentScaleKeySchema = z.enum([
  "documents",
  "cost",
  "approvalRisk",
  "speed",
  "adaptation",
])

export const dataManifestSchema = z.object({
  currentCountryCodes: z.array(countryCodeSchema).min(1),
  plannedCountryCodes: z.array(countryCodeSchema),
  targetCountryCount: z.number().int().positive(),
  lastReviewedAt: reviewedDateSchema,
  notes: z.string().min(20),
})

export const dataCountrySchema = z.object({
  code: countryCodeSchema,
  name: z.string().min(2),
  slug: z.string().min(2),
  status: countryResearchStatusSchema,
  summary: z.string().min(20),
  sourceIds: z.array(z.string().min(3)).min(1),
  lastReviewedAt: reviewedDateSchema,
})

export const dataSourceSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(8),
  url: z.string().url(),
  sourceType: sourceTypeSchema,
  countryCode: countryCodeSchema,
  language: z.string().min(2),
  lastReviewedAt: reviewedDateSchema,
  description: z.string().min(20),
  confidence: confidenceLevelSchema,
  appliesToCitizenship: z.tuple([z.literal("RU")]),
})

export const routeRequirementConfigSchema = z.object({
  minPassportMonths: z.number().int().positive().optional(),
  provableIncome: z.boolean().optional(),
  minimumMonthlyIncomeLevel: monthlyIncomeLevelSchema.optional(),
  minimumSavingsLevel: moneyLevelSchema.optional(),
  employmentContract: z.boolean().optional(),
  businessBasis: z.boolean().optional(),
  businessOrEmploymentBasis: z.boolean().optional(),
  translations: z.boolean().optional(),
  criminalRecordCertificate: z.boolean().optional(),
})

export const dataRequirementSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(8),
  affects: z.array(assessmentScaleKeySchema).min(1),
  config: routeRequirementConfigSchema.refine(
    (value) => Object.keys(value).length > 0,
    "Requirement config must not be empty"
  ),
  sourceIds: z.array(z.string().min(3)).min(1),
  lastReviewedAt: reviewedDateSchema,
})

export const dataDocumentSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(3),
  category: z.enum([
    "identity",
    "finance",
    "family",
    "business",
    "medical",
    "general",
  ]),
  sourceIds: z.array(z.string().min(3)).min(1),
  lastReviewedAt: reviewedDateSchema,
})

export const dataRouteStepSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(30),
  documents: z.array(z.string().min(2)).min(1),
  sourceIds: z.array(z.string().min(3)).min(1),
  commonMistakes: z.array(z.string().min(10)).min(1),
  specialistHelp: z.string().min(20),
})

export const dataRouteSchema = z.object({
  id: z.string().min(3),
  countryCode: countryCodeSchema,
  title: z.string().min(5),
  shortDescription: z.string().min(20),
  entryType: z.enum(["visa_free", "residence_permit", "temporary_residence"]),
  goals: z.array(relocationGoalSchema).min(1),
  stayDurations: z.array(stayDurationSchema).min(1),
  publicationStatus: publicationStatusSchema,
  confidence: confidenceLevelSchema,
  lastReviewedAt: reviewedDateSchema,
  baseDifficulty: difficultyLevelSchema,
  requirementIds: z.array(z.string().min(3)).min(1),
  supports: z.object({
    family: z.boolean(),
    children: z.boolean(),
    pets: z.boolean(),
    remoteWork: z.boolean(),
    business: z.boolean(),
    bankAccount: z.boolean(),
    lowCost: z.boolean(),
    warmClimate: z.boolean(),
    russianSpeaking: z.boolean(),
  }),
  timeline: z.object({
    preparationDays: z.number().int().nonnegative(),
    label: z.string().min(10),
  }),
  cost: z.object({
    level: costLevelSchema,
    label: z.string().min(10),
  }),
  documentIds: z.array(z.string().min(3)).min(1),
  sourceIds: z.array(z.string().min(3)).min(1),
  steps: z.array(dataRouteStepSchema).length(8),
  risks: z.array(z.string().min(10)).min(1),
})

export const dataCatalogSchema = z.object({
  manifest: dataManifestSchema,
  countries: z.array(dataCountrySchema).min(1),
  sources: z.array(dataSourceSchema).min(1),
  requirements: z.array(dataRequirementSchema).min(1),
  documents: z.array(dataDocumentSchema).min(1),
  routes: z.array(dataRouteSchema).min(1),
})

export type DataCatalog = z.infer<typeof dataCatalogSchema>
export type DataManifest = z.infer<typeof dataManifestSchema>
export type DataCountry = z.infer<typeof dataCountrySchema>
export type DataSource = z.infer<typeof dataSourceSchema>
export type DataRequirement = z.infer<typeof dataRequirementSchema>
export type DataDocument = z.infer<typeof dataDocumentSchema>
export type DataRoute = z.infer<typeof dataRouteSchema>

export function validateDataCatalog(input: unknown): DataCatalog {
  const catalog = dataCatalogSchema.parse(input)
  const countryCodes = new Set(catalog.countries.map((country) => country.code))
  const sourceIds = new Set(catalog.sources.map((source) => source.id))
  const requirementIds = new Set(
    catalog.requirements.map((requirement) => requirement.id)
  )
  const documentIds = new Set(catalog.documents.map((document) => document.id))

  assertUnique(
    "country code",
    catalog.countries.map((country) => country.code)
  )
  assertUnique("current country code", catalog.manifest.currentCountryCodes)
  assertUnique("planned country code", catalog.manifest.plannedCountryCodes)
  assertUnique(
    "source id",
    catalog.sources.map((source) => source.id)
  )
  assertUnique(
    "requirement id",
    catalog.requirements.map((requirement) => requirement.id)
  )
  assertUnique(
    "document id",
    catalog.documents.map((document) => document.id)
  )
  assertUnique(
    "route id",
    catalog.routes.map((route) => route.id)
  )

  for (const plannedCountryCode of catalog.manifest.plannedCountryCodes) {
    if (countryCodes.has(plannedCountryCode)) {
      throw new Error(
        `Country ${plannedCountryCode} cannot be current and planned at the same time`
      )
    }
  }

  if (
    catalog.manifest.targetCountryCount !==
    catalog.manifest.currentCountryCodes.length +
      catalog.manifest.plannedCountryCodes.length
  ) {
    throw new Error("Data manifest targetCountryCount does not match codes")
  }

  if (catalog.manifest.targetCountryCount < 34) {
    throw new Error("Data manifest must keep the 34-country expansion target")
  }

  const catalogCountryCodes = catalog.countries.map((country) => country.code)
  if (
    catalogCountryCodes.join("|") !==
    catalog.manifest.currentCountryCodes.join("|")
  ) {
    throw new Error("Data manifest currentCountryCodes must match countries")
  }

  for (const source of catalog.sources) {
    assertKnown(countryCodes, source.countryCode, `source ${source.id}`)
  }

  const sourceById = new Map(
    catalog.sources.map((source) => [source.id, source])
  )

  for (const country of catalog.countries) {
    assertKnownList(sourceIds, country.sourceIds, `country ${country.code}`)

    for (const sourceId of country.sourceIds) {
      const source = sourceById.get(sourceId)

      if (source?.countryCode !== country.code) {
        throw new Error(
          `Country ${country.code} references source ${sourceId} for another country`
        )
      }
    }
  }

  for (const requirement of catalog.requirements) {
    assertKnownList(
      sourceIds,
      requirement.sourceIds,
      `requirement ${requirement.id}`
    )
  }

  for (const document of catalog.documents) {
    assertKnownList(sourceIds, document.sourceIds, `document ${document.id}`)
  }

  for (const route of catalog.routes) {
    assertKnown(countryCodes, route.countryCode, `route ${route.id}`)
    assertKnownList(sourceIds, route.sourceIds, `route ${route.id}`)
    assertKnownList(requirementIds, route.requirementIds, `route ${route.id}`)
    assertKnownList(documentIds, route.documentIds, `route ${route.id}`)

    for (const step of route.steps) {
      assertKnownList(sourceIds, step.sourceIds, `route ${route.id} step`)
    }
  }

  return catalog
}

function assertUnique(label: string, values: string[]): void {
  const seen = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value}`)
    }

    seen.add(value)
  }
}

function assertKnown(known: Set<string>, value: string, owner: string): void {
  if (!known.has(value)) {
    throw new Error(`Unknown reference ${value} in ${owner}`)
  }
}

function assertKnownList(
  known: Set<string>,
  values: string[],
  owner: string
): void {
  for (const value of values) {
    assertKnown(known, value, owner)
  }
}
