import { describe, expect, it } from "vitest"

import { countries } from "./countries"
import { dataManifest } from "./data-catalog"
import { routes } from "./routes"
import { sources } from "./sources"

describe("country and source catalogue", () => {
  it("contains the MVP country set and keeps room for the 34-country expansion", () => {
    const codes = countries.map((country) => country.code)

    expect(countries.length).toBeGreaterThanOrEqual(20)
    expect(dataManifest.targetCountryCount).toBeGreaterThanOrEqual(34)
    expect(dataManifest.currentCountryCodes).toEqual(codes)
    expect(dataManifest.plannedCountryCodes).toEqual(
      expect.arrayContaining([
        "AT",
        "NL",
        "FI",
        "CZ",
        "CH",
        "LT",
        "LV",
        "GR",
        "SE",
        "IL",
        "BR",
        "MX",
        "AR",
        "ID",
      ])
    )
    expect(codes).toEqual(
      expect.arrayContaining([
        "GE",
        "RS",
        "AM",
        "TR",
        "KZ",
        "KG",
        "UZ",
        "ME",
        "VN",
        "TH",
        "AE",
        "CY",
        "ES",
        "PT",
        "DE",
        "FR",
        "PL",
        "BG",
        "HU",
        "IT",
      ])
    )
  })

  it("keeps every source attributable and applicable to Russian citizens", () => {
    for (const source of sources) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.title.length).toBeGreaterThan(8)
      expect(source.sourceType).toBeDefined()
      expect(source.countryCode).toBeDefined()
      expect(source.lastReviewedAt).toBe("2026-06-18")
      expect(source.confidence).toMatch(/^(low|medium|high)$/)
      expect(source.appliesToCitizenship).toContain("RU")
    }
  })

  it("keeps every country attributable with a reviewed date and depth status", () => {
    const allowedStatuses = new Set([
      "reviewed",
      "needs_review",
      "stale",
      "reference_only",
    ])
    const sourceIds = new Set(sources.map((source) => source.id))

    for (const country of countries) {
      expect(allowedStatuses.has(country.status)).toBe(true)
      expect(country.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(country.sourceIds.length).toBeGreaterThan(0)

      for (const sourceId of country.sourceIds) {
        expect(sourceIds.has(sourceId)).toBe(true)
      }
    }
  })

  it("uses conservative depth statuses for countries that are not deeply checked", () => {
    expect(countries.some((country) => country.status !== "reviewed")).toBe(
      true
    )
    expect(
      countries
        .filter((country) => country.status === "reviewed")
        .map((country) => country.code)
    ).toEqual(expect.arrayContaining(["GE", "RS", "AM", "TR", "KZ"]))
  })

  it("does not publish stale routes as reviewed", () => {
    expect(countries.some((country) => country.status === "stale")).toBe(true)
    expect(routes.some((route) => route.publicationStatus === "stale")).toBe(
      true
    )
    expect(
      routes.every((route) =>
        route.publicationStatus === "reviewed"
          ? route.confidence !== "low"
          : true
      )
    ).toBe(true)
  })

  it("links every route to reviewed sources", () => {
    const sourceIds = new Set(sources.map((source) => source.id))

    for (const route of routes) {
      expect(route.lastReviewedAt).toBe("2026-06-18")
      expect(route.sourceIds.length).toBeGreaterThan(0)

      for (const sourceId of route.sourceIds) {
        expect(sourceIds.has(sourceId)).toBe(true)
      }
    }
  })
})
