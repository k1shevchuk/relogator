import { describe, expect, it } from "vitest"

import {
  buildContentCatalogueFromRows,
  contentCountryRowToCountry,
  contentRouteRowToRoute,
  contentSourceRowToSource,
  localContentCatalogue,
} from "./content-catalogue"

describe("content catalogue database adapter", () => {
  it("maps database country rows to the domain country shape", () => {
    const country = contentCountryRowToCountry({
      code: "GE",
      name: "Грузия",
      slug: "georgia",
      status: "reviewed",
      summary: "Безвизовый маршрут для первого этапа.",
      source_ids: ["georgia-visa-free-ordinance"],
      last_reviewed_at: "2026-06-18",
    })

    expect(country).toEqual({
      code: "GE",
      name: "Грузия",
      slug: "georgia",
      status: "reviewed",
      summary: "Безвизовый маршрут для первого этапа.",
      sourceIds: ["georgia-visa-free-ordinance"],
      lastReviewedAt: "2026-06-18",
    })
  })

  it("maps database source rows to the domain source shape", () => {
    const source = contentSourceRowToSource({
      id: "georgia-visa-free-ordinance",
      title: "Правительство Грузии: список безвизовых стран",
      url: "https://matsne.gov.ge/en/document/view/2867361",
      source_type: "law",
      country_code: "GE",
      language: "en",
      last_reviewed_at: "2026-06-18",
      description: "Официальный перечень стран для безвизового въезда.",
      confidence: "high",
      applies_to_citizenship: ["RU"],
    })

    expect(source.countryCode).toBe("GE")
    expect(source.sourceType).toBe("law")
    expect(source.appliesToCitizenship).toEqual(["RU"])
  })

  it("maps database route rows to hydrated route definitions", () => {
    const route = contentRouteRowToRoute({
      id: "georgia-visa-free-one-year",
      country_code: "GE",
      title: "Безвизовое пребывание до одного года",
      short_description: "Подходит для первого этапа переезда.",
      entry_type: "visa_free",
      goals: ["quick_exit", "medium_stay"],
      stay_durations: ["one_to_three_months", "six_to_twelve_months"],
      publication_status: "reviewed",
      confidence: "high",
      last_reviewed_at: "2026-06-18",
      base_difficulty: 2,
      requirements: { minPassportMonths: 6 },
      supports: {
        family: true,
        children: true,
        pets: true,
        remoteWork: true,
        business: false,
        bankAccount: true,
        lowCost: false,
        warmClimate: true,
        russianSpeaking: true,
      },
      timeline: { preparationDays: 10, label: "1-2 недели" },
      cost: { level: "medium", label: "средние расходы" },
      documents: ["Загранпаспорт РФ"],
      source_ids: ["georgia-visa-free-ordinance"],
      steps: [
        {
          title: "Что проверить до решения",
          description: "Проверить право въезда и срок паспорта.",
          documents: ["Загранпаспорт РФ"],
          sourceIds: ["georgia-visa-free-ordinance"],
          commonMistakes: ["Не проверить применимость правила к гражданам РФ."],
          specialistHelp: "Нужен при спорном въезде.",
        },
      ],
      risks: ["Правила могут измениться."],
    })

    expect(route.countryCode).toBe("GE")
    expect(route.requirements.minPassportMonths).toBe(6)
    expect(route.steps[0].sourceIds).toEqual(["georgia-visa-free-ordinance"])
  })

  it("builds a complete catalogue from table rows and preserves local fallback data", () => {
    const country = localContentCatalogue.countries[0]
    const countrySources = localContentCatalogue.sources.filter(
      (item) => item.countryCode === country.code
    )
    const route = localContentCatalogue.routes.find(
      (item) => item.countryCode === country.code
    )

    expect(countrySources.length).toBeGreaterThan(0)
    expect(route).toBeDefined()

    const catalogue = buildContentCatalogueFromRows({
      countries: [
        {
          code: country.code,
          name: country.name,
          slug: country.slug,
          status: country.status,
          summary: country.summary,
          source_ids: country.sourceIds,
          last_reviewed_at: country.lastReviewedAt,
        },
      ],
      sources: countrySources.map((source) => ({
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
      })),
      routes: [
        {
          id: route!.id,
          country_code: route!.countryCode,
          title: route!.title,
          short_description: route!.shortDescription,
          entry_type: route!.entryType,
          goals: route!.goals,
          stay_durations: route!.stayDurations,
          publication_status: route!.publicationStatus,
          confidence: route!.confidence,
          last_reviewed_at: route!.lastReviewedAt,
          base_difficulty: route!.baseDifficulty,
          requirements: route!.requirements,
          supports: route!.supports,
          timeline: route!.timeline,
          cost: route!.cost,
          documents: route!.documents,
          source_ids: route!.sourceIds,
          steps: route!.steps,
          risks: route!.risks,
        },
      ],
    })

    expect(catalogue.countries).toHaveLength(1)
    expect(catalogue.sources).toHaveLength(countrySources.length)
    expect(catalogue.routes).toHaveLength(1)
    expect(localContentCatalogue.routes.length).toBeGreaterThanOrEqual(20)
  })
})
