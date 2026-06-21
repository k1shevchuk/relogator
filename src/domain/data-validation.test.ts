import { describe, expect, it } from "vitest"

import { dataCatalog } from "./data-catalog"

describe("data catalog validation", () => {
  it("loads and validates the structured data catalog", () => {
    expect(dataCatalog.countries.length).toBeGreaterThanOrEqual(20)
    expect(dataCatalog.sources.length).toBeGreaterThan(0)
    expect(dataCatalog.requirements.length).toBeGreaterThan(0)
    expect(dataCatalog.documents.length).toBeGreaterThan(0)
    expect(dataCatalog.routes.length).toBeGreaterThan(0)
    expect(dataCatalog.manifest.targetCountryCount).toBeGreaterThanOrEqual(34)
  })

  it("keeps every public route attributable", () => {
    for (const route of dataCatalog.routes) {
      expect(route.sourceIds.length).toBeGreaterThan(0)
      expect(route.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it("keeps every country attributable and explicitly reviewed", () => {
    for (const country of dataCatalog.countries) {
      expect(country.sourceIds.length).toBeGreaterThan(0)
      expect(country.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(country.status).toMatch(
        /^(reviewed|needs_review|stale|reference_only)$/
      )
    }
  })
})
