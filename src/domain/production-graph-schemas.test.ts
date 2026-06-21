import { describe, expect, it } from "vitest"

import { countries } from "./countries"
import { dataManifest } from "./data-catalog"
import {
  collectProductionGraphCountryCodes,
  loadProductionGraphDrafts,
  validateProductionGraphDraft,
} from "./production-graph-schemas.mts"

describe("production graph draft validation", () => {
  it("does not allow a graph with source_needed to suggest reviewed publication", () => {
    const draft = makeGraphDraft({
      countries: [
        makeGraphCountry({
          routeNodes: [
            makeRouteNode({
              sourceIds: ["source_needed"],
              publicationStatusSuggestion: "reviewed",
            }),
          ],
        }),
      ],
    })

    const result = validateProductionGraphDraft(draft, "source-needed.json")

    expect(result.ok).toBe(false)
    expect(result.issues.map((issue) => issue.message)).toContain(
      "publicationStatusSuggestion reviewed is not allowed while source_needed is present"
    )
  })

  it("reports route references to unknown sources, legal facts and requirements", () => {
    const draft = makeGraphDraft({
      countries: [
        makeGraphCountry({
          routeNodes: [
            makeRouteNode({
              sourceIds: ["missing-source"],
              legalFactIds: ["missing-legal-fact"],
              requirementIds: ["missing-requirement"],
            }),
          ],
        }),
      ],
    })

    const result = validateProductionGraphDraft(draft, "unknown-refs.json")
    const messages = result.issues.map((issue) => issue.message)

    expect(result.ok).toBe(false)
    expect(messages).toContain(
      "Unknown reference missing-source in route georgia-short-entry sourceIds"
    )
    expect(messages).toContain(
      "Unknown reference missing-legal-fact in route georgia-short-entry legalFactIds"
    )
    expect(messages).toContain(
      "Unknown reference missing-requirement in route georgia-short-entry requirementIds"
    )
  })

  it("rejects legal promises in graph text", () => {
    const draft = makeGraphDraft({
      countries: [
        makeGraphCountry({
          routeNodes: [
            makeRouteNode({
              unlocks: [
                "После подачи точно одобрят ВНЖ, без отказа и на 100%.",
              ],
            }),
          ],
        }),
      ],
    })

    const result = validateProductionGraphDraft(draft, "promises.json")

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.message.includes("legal promise"))
    ).toBe(true)
  })

  it("keeps every catalog country covered by public data or graph drafts", () => {
    const drafts = loadProductionGraphDrafts("data/drafts/production-graphs")
    const publicCodes = new Set(countries.map((country) => country.code))
    const graphCodes = collectProductionGraphCountryCodes(drafts.drafts)
    const requiredCodes = [
      ...dataManifest.currentCountryCodes,
      ...dataManifest.plannedCountryCodes,
    ]

    const missing = requiredCodes.filter(
      (countryCode) =>
        !publicCodes.has(countryCode) && !graphCodes.has(countryCode)
    )

    expect(missing).toEqual([])
  })
})

function makeGraphDraft(
  overrides: Partial<ReturnType<typeof makeGraphDraftBase>> = {}
) {
  return {
    ...makeGraphDraftBase(),
    ...overrides,
  }
}

function makeGraphDraftBase() {
  return {
    meta: {
      agent: "graph-test",
      createdAt: "2026-06-20",
      model: "manual-test",
      status: "draft",
      scopeCountries: ["GE"],
      limitations: [],
    },
    countries: [makeGraphCountry()],
  }
}

function makeGraphCountry(overrides = {}) {
  return {
    countryCode: "GE",
    countryNameRu: "Грузия",
    graphStatus: "needs_review",
    jurisdictions: [
      {
        id: "GE",
        type: "target_country",
        name: "Грузия",
        notes: [],
      },
    ],
    sourceNodes: [
      {
        id: "georgia-official-source",
        title: "Official migration source",
        url: "https://example.gov/georgia",
        sourceType: "official_body",
        jurisdiction: "GE",
        language: "en",
        lastCheckedAt: "2026-06-20",
        appliesToCitizenship: ["RU"],
        confidence: "high",
        officialness: "official",
        quoteOrFact: "Краткий проверяемый факт из официального источника.",
      },
    ],
    legalFactNodes: [
      {
        id: "georgia-entry-fact",
        sourceIds: ["georgia-official-source"],
        factType: "entry",
        fact: "Гражданам РФ нужно проверять условия въезда по официальному источнику.",
        appliesWhen: [
          {
            field: "citizenship",
            operator: "equals",
            value: "RU",
          },
        ],
        exceptions: [],
        needsManualReview: false,
        confidence: "high",
      },
    ],
    requirementNodes: [
      {
        id: "passport-requirement",
        title: "Проверить срок действия паспорта",
        sourceIds: ["georgia-official-source"],
        legalFactIds: ["georgia-entry-fact"],
        appliesWhen: [],
        documents: [],
        hardBlockerWhenMissing: true,
        affects: ["documents", "approvalRisk"],
        confidence: "medium",
      },
    ],
    routeNodes: [makeRouteNode()],
    personalizationRules: [
      {
        id: "passport-rule",
        routeIds: ["georgia-short-entry"],
        if: [
          {
            field: "passportStatus",
            operator: "equals",
            value: "none",
          },
        ],
        then: {
          availability: "blocked",
          blockers: ["Нет действующего загранпаспорта."],
          unlocks: ["Оформить загранпаспорт."],
          difficultyDelta: {
            documents: 2,
            approvalRisk: 2,
          },
        },
        sourceIds: ["georgia-official-source"],
      },
    ],
    reviewLog: [
      {
        round: 1,
        issue: "Проверена базовая связность графа.",
        action: "Оставлено как тестовый черновик.",
      },
    ],
    manualReviewQuestions: [],
    ...overrides,
  }
}

function makeRouteNode(overrides = {}) {
  return {
    id: "georgia-short-entry",
    title: "Короткий въезд",
    routeType: "short_entry",
    goals: ["quick_exit", "medium_stay"],
    stayDurations: ["one_to_three_months"],
    entryCountries: ["RU"],
    exitCountries: ["GE"],
    transitRisks: [],
    sourceIds: ["georgia-official-source"],
    legalFactIds: ["georgia-entry-fact"],
    requirementIds: ["passport-requirement"],
    personalizationRuleIds: ["passport-rule"],
    manualReviewQuestions: [],
    documents: [],
    steps: [
      {
        id: "check-entry",
        title: "Проверить въезд",
        description:
          "Сверить актуальные условия въезда по официальному источнику.",
        sourceIds: ["georgia-official-source"],
        legalFactIds: ["georgia-entry-fact"],
      },
    ],
    blockers: [],
    unlocks: ["Проверить документы до выезда."],
    difficulty: {
      documents: 2,
      cost: 2,
      approvalRisk: 2,
      speed: 1,
      adaptation: 2,
    },
    publicationStatusSuggestion: "needs_review",
    confidence: "medium",
    ...overrides,
  }
}
