import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { z } from "zod"

const sourceNeeded = "source_needed"
const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/)
const reviewedDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const idSchema = z.string().min(3)
const confidenceLevelSchema = z.enum(["low", "medium", "high"])
const graphStatusSchema = z.enum([
  "draft",
  "reviewed",
  "needs_review",
  "stale",
  "reference_only",
  "archived",
])
const routeTypeSchema = z.enum([
  "short_entry",
  "medium_stay",
  "residence",
  "remote_work",
  "local_work",
  "business",
  "family",
  "study",
  "pets",
])
const relocationGoalSchema = z.enum([
  "quick_exit",
  "medium_stay",
  "residence",
  "remote_work",
  "local_work",
  "business",
  "family",
  "compare",
])
const stayDurationSchema = z.enum([
  "up_to_one_month",
  "one_to_three_months",
  "three_to_six_months",
  "six_to_twelve_months",
  "more_than_year",
  "permanent_status",
])
const factTypeSchema = z.enum([
  "entry",
  "stay",
  "residence",
  "work",
  "business",
  "family",
  "study",
  "pets",
  "tax",
  "banking",
  "exit",
  "transit",
])
const conditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "in",
  "not_in",
  "gte",
  "lte",
  "exists",
])
const assessmentScaleKeySchema = z.enum([
  "documents",
  "cost",
  "approvalRisk",
  "speed",
  "adaptation",
])
const difficultyLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
const sourceIdReferenceSchema = z.union([idSchema, z.literal(sourceNeeded)])
const countryOrSourceNeededSchema = z.union([
  countryCodeSchema,
  z.literal(sourceNeeded),
])

export const graphRuleConditionSchema = z.object({
  field: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.unknown().optional(),
})

export const graphDocumentNodeSchema = z.object({
  id: idSchema.optional(),
  title: z.string().min(3),
  sourceIds: z.array(sourceIdReferenceSchema).default([]),
  legalFactIds: z.array(idSchema).default([]),
  notes: z.array(z.string().min(1)).default([]),
})

export const graphSourceNodeSchema = z.object({
  id: idSchema,
  title: z.string().min(3),
  url: z.union([z.string().url(), z.literal(sourceNeeded)]),
  sourceType: z.enum([
    "official_body",
    "law",
    "consulate",
    "statistics",
    "government_portal",
    "partner",
    "editorial_note",
    sourceNeeded,
  ]),
  jurisdiction: z.string().min(2),
  language: z.string().min(2),
  lastCheckedAt: reviewedDateSchema,
  appliesToCitizenship: z.array(z.literal("RU")).min(1),
  confidence: confidenceLevelSchema,
  officialness: z.enum([
    "official",
    "partner",
    "editorial",
    "unknown",
    sourceNeeded,
  ]),
  quoteOrFact: z.string().min(10),
})

export const graphLegalFactNodeSchema = z.object({
  id: idSchema,
  sourceIds: z.array(sourceIdReferenceSchema).min(1),
  factType: factTypeSchema,
  fact: z.string().min(10),
  appliesWhen: z.array(graphRuleConditionSchema).default([]),
  exceptions: z.array(z.string().min(1)).default([]),
  needsManualReview: z.boolean(),
  confidence: confidenceLevelSchema,
})

export const graphRequirementNodeSchema = z.object({
  id: idSchema,
  title: z.string().min(3),
  sourceIds: z.array(sourceIdReferenceSchema).default([]),
  legalFactIds: z.array(idSchema).default([]),
  appliesWhen: z.array(graphRuleConditionSchema).default([]),
  documents: z.array(graphDocumentNodeSchema).default([]),
  hardBlockerWhenMissing: z.boolean().default(false),
  affects: z.array(assessmentScaleKeySchema).min(1),
  confidence: confidenceLevelSchema,
})

export const graphRouteStepSchema = z.object({
  id: idSchema,
  title: z.string().min(3),
  description: z.string().min(10),
  sourceIds: z.array(sourceIdReferenceSchema).default([]),
  legalFactIds: z.array(idSchema).default([]),
  documents: z.array(graphDocumentNodeSchema).default([]),
  manualReviewQuestions: z.array(z.string().min(3)).default([]),
})

export const graphRouteNodeSchema = z.object({
  id: idSchema,
  title: z.string().min(3),
  routeType: routeTypeSchema,
  goals: z.array(relocationGoalSchema).min(1),
  stayDurations: z.array(stayDurationSchema).min(1),
  entryCountries: z.array(countryOrSourceNeededSchema).min(1),
  exitCountries: z.array(countryOrSourceNeededSchema).min(1),
  transitRisks: z.array(z.string().min(1)).default([]),
  sourceIds: z.array(sourceIdReferenceSchema).default([]),
  legalFactIds: z.array(idSchema).default([]),
  requirementIds: z.array(idSchema).default([]),
  personalizationRuleIds: z.array(idSchema).default([]),
  manualReviewQuestions: z.array(z.string().min(3)).default([]),
  documents: z.array(graphDocumentNodeSchema).default([]),
  steps: z.array(graphRouteStepSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  unlocks: z.array(z.string().min(1)).default([]),
  difficulty: z.object({
    documents: difficultyLevelSchema,
    cost: difficultyLevelSchema,
    approvalRisk: difficultyLevelSchema,
    speed: difficultyLevelSchema,
    adaptation: difficultyLevelSchema,
  }),
  publicationStatusSuggestion: graphStatusSchema,
  confidence: confidenceLevelSchema,
})

export const graphPersonalizationRuleSchema = z.object({
  id: idSchema,
  routeIds: z.array(idSchema).default([]),
  if: z.array(graphRuleConditionSchema).min(1),
  then: z.object({
    availability: z.enum(["available", "conditional", "blocked", "unknown"]),
    blockers: z.array(z.string().min(1)).default([]),
    unlocks: z.array(z.string().min(1)).default([]),
    difficultyDelta: z.record(z.string(), z.number().int()).default({}),
  }),
  sourceIds: z.array(sourceIdReferenceSchema).default([]),
})

export const graphReviewLogEntrySchema = z.object({
  round: z.number().int().positive(),
  issue: z.string().min(3),
  action: z.string().min(3),
})

export const graphCountrySchema = z.object({
  countryCode: countryCodeSchema,
  countryNameRu: z.string().min(2),
  graphStatus: graphStatusSchema,
  jurisdictions: z
    .array(
      z.object({
        id: z.string().min(2),
        type: z.enum([
          "target_country",
          "entry_country",
          "exit_country",
          "transit_country",
          "filing_country",
          "external_zone",
        ]),
        name: z.string().min(2),
        notes: z.array(z.string().min(1)).default([]),
      })
    )
    .min(1),
  sourceNodes: z.array(graphSourceNodeSchema).default([]),
  legalFactNodes: z.array(graphLegalFactNodeSchema).default([]),
  requirementNodes: z.array(graphRequirementNodeSchema).default([]),
  routeNodes: z.array(graphRouteNodeSchema).default([]),
  personalizationRules: z.array(graphPersonalizationRuleSchema).default([]),
  reviewLog: z.array(graphReviewLogEntrySchema).default([]),
  manualReviewQuestions: z.array(z.string().min(3)).default([]),
})

export const graphDraftSchema = z.object({
  meta: z.object({
    agent: z.string().min(3),
    createdAt: reviewedDateSchema,
    model: z.string().min(3),
    status: z.enum(["draft", "needs_review", "ready_for_review", "archived"]),
    scopeCountries: z.array(countryCodeSchema).min(1),
    limitations: z.array(z.string()).default([]),
  }),
  countries: z.array(graphCountrySchema).min(1),
})

export type GraphDraft = z.infer<typeof graphDraftSchema>
export type GraphCountry = z.infer<typeof graphCountrySchema>
export type GraphSourceNode = z.infer<typeof graphSourceNodeSchema>
export type GraphLegalFactNode = z.infer<typeof graphLegalFactNodeSchema>
export type GraphRequirementNode = z.infer<typeof graphRequirementNodeSchema>
export type GraphRouteNode = z.infer<typeof graphRouteNodeSchema>
export type GraphPersonalizationRule = z.infer<
  typeof graphPersonalizationRuleSchema
>
export type GraphReviewLogEntry = z.infer<typeof graphReviewLogEntrySchema>

export type GraphValidationIssue = {
  file: string
  path: string
  message: string
}

export type GraphValidationResult = {
  file: string
  ok: boolean
  draft?: GraphDraft
  issues: GraphValidationIssue[]
}

export type LoadedProductionGraphDrafts = {
  drafts: GraphDraft[]
  results: GraphValidationResult[]
}

const legalPromisePattern =
  /(гарантированн[оа]|точно\s+одобрят|100\s*%|без\s+отказа|одобрят\s+точно|гарантия\s+одобрения)/iu

export function validateProductionGraphDraft(
  input: unknown,
  file = "graph.json"
): GraphValidationResult {
  const issues: GraphValidationIssue[] = []

  findLegalPromises(input, file, [], issues)

  const parsed = graphDraftSchema.safeParse(input)

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        file,
        path: formatPath(issue.path),
        message: issue.message,
      })
    }

    return { file, ok: false, issues }
  }

  validateGraphSemantics(parsed.data, file, issues)

  return {
    file,
    ok: issues.length === 0,
    draft: parsed.data,
    issues,
  }
}

export function loadProductionGraphDrafts(
  directory: string
): LoadedProductionGraphDrafts {
  if (!existsSync(directory)) {
    return { drafts: [], results: [] }
  }

  const files = readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort((first, second) => first.localeCompare(second))

  const results = files.map((file) => {
    const filePath = path.join(directory, file)

    try {
      return validateProductionGraphDraft(
        JSON.parse(readFileSync(filePath, "utf8")),
        filePath
      )
    } catch (error) {
      return {
        file: filePath,
        ok: false,
        issues: [
          {
            file: filePath,
            path: "$",
            message:
              error instanceof Error
                ? error.message
                : "Cannot parse graph JSON",
          },
        ],
      } satisfies GraphValidationResult
    }
  })

  return {
    drafts: results
      .map((result) => result.draft)
      .filter((draft): draft is GraphDraft => Boolean(draft)),
    results,
  }
}

export function collectProductionGraphCountryCodes(
  drafts: GraphDraft[]
): Set<string> {
  return new Set(
    drafts.flatMap((draft) =>
      draft.countries.map((country) => country.countryCode)
    )
  )
}

function validateGraphSemantics(
  draft: GraphDraft,
  file: string,
  issues: GraphValidationIssue[]
): void {
  assertUnique(
    draft.countries.map((country) => country.countryCode),
    file,
    "$.countries",
    issues,
    "countryCode"
  )

  for (const country of draft.countries) {
    const countryPath = `$.countries[${country.countryCode}]`
    const ids: string[] = [
      ...country.jurisdictions.map((jurisdiction) => jurisdiction.id),
      ...country.sourceNodes.map((source) => source.id),
      ...country.legalFactNodes.map((fact) => fact.id),
      ...country.requirementNodes.map((requirement) => requirement.id),
      ...country.routeNodes.map((route) => route.id),
      ...country.personalizationRules.map((rule) => rule.id),
      ...country.routeNodes.flatMap((route) =>
        route.steps.map((step) => step.id)
      ),
    ]

    assertUnique(ids, file, countryPath, issues, "id")

    const sourceIds = new Set(country.sourceNodes.map((source) => source.id))
    const legalFactIds = new Set(
      country.legalFactNodes.map((legalFact) => legalFact.id)
    )
    const requirementIds = new Set(
      country.requirementNodes.map((requirement) => requirement.id)
    )
    const routeIds = new Set(country.routeNodes.map((route) => route.id))
    const personalizationRuleIds = new Set(
      country.personalizationRules.map((rule) => rule.id)
    )
    const hasSourceNeeded = countryHasSourceNeeded(country)

    if (hasSourceNeeded && country.graphStatus === "reviewed") {
      issues.push({
        file,
        path: `${countryPath}.graphStatus`,
        message:
          "graphStatus reviewed is not allowed while source_needed is present",
      })
    }

    for (const legalFact of country.legalFactNodes) {
      assertSourceReferences(
        legalFact.sourceIds,
        sourceIds,
        file,
        `${countryPath}.legalFactNodes[${legalFact.id}].sourceIds`,
        `legal fact ${legalFact.id} sourceIds`,
        issues
      )
      assertPublicSourceBackbone(
        legalFact.sourceIds,
        [],
        file,
        `${countryPath}.legalFactNodes[${legalFact.id}]`,
        "legal fact",
        issues
      )
    }

    for (const requirement of country.requirementNodes) {
      assertSourceReferences(
        requirement.sourceIds,
        sourceIds,
        file,
        `${countryPath}.requirementNodes[${requirement.id}].sourceIds`,
        `requirement ${requirement.id} sourceIds`,
        issues
      )
      assertKnownReferences(
        requirement.legalFactIds,
        legalFactIds,
        file,
        `${countryPath}.requirementNodes[${requirement.id}].legalFactIds`,
        `requirement ${requirement.id} legalFactIds`,
        issues
      )
      assertPublicSourceBackbone(
        requirement.sourceIds,
        requirement.legalFactIds,
        file,
        `${countryPath}.requirementNodes[${requirement.id}]`,
        "requirement",
        issues
      )

      for (const document of requirement.documents) {
        validateDocumentReferences(
          document,
          sourceIds,
          legalFactIds,
          file,
          `${countryPath}.requirementNodes[${requirement.id}].documents`,
          issues
        )
      }
    }

    for (const route of country.routeNodes) {
      validateRouteReferences(route, {
        file,
        countryPath,
        issues,
        sourceIds,
        legalFactIds,
        requirementIds,
        personalizationRuleIds,
      })

      if (hasSourceNeeded && route.publicationStatusSuggestion === "reviewed") {
        issues.push({
          file,
          path: `${countryPath}.routeNodes[${route.id}].publicationStatusSuggestion`,
          message:
            "publicationStatusSuggestion reviewed is not allowed while source_needed is present",
        })
      }
    }

    for (const rule of country.personalizationRules) {
      assertKnownReferences(
        rule.routeIds,
        routeIds,
        file,
        `${countryPath}.personalizationRules[${rule.id}].routeIds`,
        `personalization rule ${rule.id} routeIds`,
        issues
      )
      assertSourceReferences(
        rule.sourceIds,
        sourceIds,
        file,
        `${countryPath}.personalizationRules[${rule.id}].sourceIds`,
        `personalization rule ${rule.id} sourceIds`,
        issues
      )
      assertPublicSourceBackbone(
        rule.sourceIds,
        rule.routeIds,
        file,
        `${countryPath}.personalizationRules[${rule.id}]`,
        "personalization rule",
        issues
      )
    }
  }
}

function validateRouteReferences(
  route: GraphRouteNode,
  context: {
    file: string
    countryPath: string
    issues: GraphValidationIssue[]
    sourceIds: Set<string>
    legalFactIds: Set<string>
    requirementIds: Set<string>
    personalizationRuleIds: Set<string>
  }
): void {
  const routePath = `${context.countryPath}.routeNodes[${route.id}]`

  assertSourceReferences(
    route.sourceIds,
    context.sourceIds,
    context.file,
    `${routePath}.sourceIds`,
    `route ${route.id} sourceIds`,
    context.issues
  )
  assertKnownReferences(
    route.legalFactIds,
    context.legalFactIds,
    context.file,
    `${routePath}.legalFactIds`,
    `route ${route.id} legalFactIds`,
    context.issues
  )
  assertKnownReferences(
    route.requirementIds,
    context.requirementIds,
    context.file,
    `${routePath}.requirementIds`,
    `route ${route.id} requirementIds`,
    context.issues
  )
  assertKnownReferences(
    route.personalizationRuleIds,
    context.personalizationRuleIds,
    context.file,
    `${routePath}.personalizationRuleIds`,
    `route ${route.id} personalizationRuleIds`,
    context.issues
  )
  assertPublicSourceBackbone(
    route.sourceIds,
    [...route.legalFactIds, ...route.requirementIds],
    context.file,
    routePath,
    "route",
    context.issues
  )

  for (const document of route.documents) {
    validateDocumentReferences(
      document,
      context.sourceIds,
      context.legalFactIds,
      context.file,
      `${routePath}.documents`,
      context.issues
    )
  }

  for (const step of route.steps) {
    assertSourceReferences(
      step.sourceIds,
      context.sourceIds,
      context.file,
      `${routePath}.steps[${step.id}].sourceIds`,
      `route step ${step.id} sourceIds`,
      context.issues
    )
    assertKnownReferences(
      step.legalFactIds,
      context.legalFactIds,
      context.file,
      `${routePath}.steps[${step.id}].legalFactIds`,
      `route step ${step.id} legalFactIds`,
      context.issues
    )
    assertPublicSourceBackbone(
      step.sourceIds,
      step.legalFactIds,
      context.file,
      `${routePath}.steps[${step.id}]`,
      "route step",
      context.issues
    )
  }
}

function validateDocumentReferences(
  document: z.infer<typeof graphDocumentNodeSchema>,
  sourceIds: Set<string>,
  legalFactIds: Set<string>,
  file: string,
  ownerPath: string,
  issues: GraphValidationIssue[]
): void {
  const documentLabel = document.id ?? document.title
  const documentPath = `${ownerPath}[${documentLabel}]`

  assertSourceReferences(
    document.sourceIds,
    sourceIds,
    file,
    `${documentPath}.sourceIds`,
    `document ${documentLabel} sourceIds`,
    issues
  )
  assertKnownReferences(
    document.legalFactIds,
    legalFactIds,
    file,
    `${documentPath}.legalFactIds`,
    `document ${documentLabel} legalFactIds`,
    issues
  )
  assertPublicSourceBackbone(
    document.sourceIds,
    document.legalFactIds,
    file,
    documentPath,
    "document",
    issues
  )
}

function assertUnique(
  values: string[],
  file: string,
  ownerPath: string,
  issues: GraphValidationIssue[],
  label: string
): void {
  const seen = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      issues.push({
        file,
        path: ownerPath,
        message: `Duplicate ${label}: ${value}`,
      })
    }

    seen.add(value)
  }
}

function assertSourceReferences(
  values: string[],
  known: Set<string>,
  file: string,
  ownerPath: string,
  ownerLabel: string,
  issues: GraphValidationIssue[]
): void {
  for (const value of values) {
    if (value !== sourceNeeded && !known.has(value)) {
      issues.push({
        file,
        path: ownerPath,
        message: `Unknown reference ${value} in ${ownerLabel}`,
      })
    }
  }
}

function assertKnownReferences(
  values: string[],
  known: Set<string>,
  file: string,
  ownerPath: string,
  ownerLabel: string,
  issues: GraphValidationIssue[]
): void {
  for (const value of values) {
    if (!known.has(value)) {
      issues.push({
        file,
        path: ownerPath,
        message: `Unknown reference ${value} in ${ownerLabel}`,
      })
    }
  }
}

function assertPublicSourceBackbone(
  sourceIds: string[],
  inheritedIds: string[],
  file: string,
  ownerPath: string,
  ownerLabel: string,
  issues: GraphValidationIssue[]
): void {
  if (sourceIds.length === 0 && inheritedIds.length === 0) {
    issues.push({
      file,
      path: ownerPath,
      message: `${ownerLabel} must reference sourceIds, legalFactIds, requirementIds, routeIds or explicit source_needed`,
    })
  }
}

function countryHasSourceNeeded(country: GraphCountry): boolean {
  if (
    country.sourceNodes.some(
      (source) =>
        source.id === sourceNeeded ||
        source.url === sourceNeeded ||
        source.sourceType === sourceNeeded ||
        source.officialness === sourceNeeded
    )
  ) {
    return true
  }

  return [
    ...country.legalFactNodes.flatMap((item) => item.sourceIds),
    ...country.requirementNodes.flatMap((item) => item.sourceIds),
    ...country.routeNodes.flatMap((item) => [
      ...item.sourceIds,
      ...item.entryCountries,
      ...item.exitCountries,
      ...item.steps.flatMap((step) => step.sourceIds),
      ...item.documents.flatMap((document) => document.sourceIds),
    ]),
    ...country.personalizationRules.flatMap((item) => item.sourceIds),
  ].includes(sourceNeeded)
}

function findLegalPromises(
  input: unknown,
  file: string,
  pathParts: Array<string | number>,
  issues: GraphValidationIssue[]
): void {
  if (typeof input === "string") {
    if (legalPromisePattern.test(input)) {
      issues.push({
        file,
        path: formatPath(pathParts),
        message: "Forbidden legal promise wording detected",
      })
    }

    return
  }

  if (Array.isArray(input)) {
    input.forEach((value, index) =>
      findLegalPromises(value, file, [...pathParts, index], issues)
    )
    return
  }

  if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(input)) {
      findLegalPromises(value, file, [...pathParts, key], issues)
    }
  }
}

function formatPath(pathParts: readonly PropertyKey[]): string {
  if (pathParts.length === 0) {
    return "$"
  }

  return `$${pathParts
    .map((part) => {
      if (typeof part === "number") {
        return `[${part}]`
      }

      const value = typeof part === "symbol" ? part.toString() : part
      return `.${value.replace(/\./g, "\\.")}`
    })
    .join("")}`
}
