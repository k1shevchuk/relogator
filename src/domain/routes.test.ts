import { describe, expect, it } from "vitest"

import { routes } from "./routes"

const requiredStepTitles = [
  "Что проверить до решения",
  "Что подготовить в РФ",
  "Что сделать перед выездом",
  "Что сделать после въезда",
  "Что сделать в первые 7 дней",
  "Что сделать в первые 30 дней",
  "Что проверить до окончания срока",
  "Когда нужен специалист",
]

describe("route catalogue", () => {
  it("keeps every route practical enough for the route page", () => {
    for (const route of routes) {
      expect(route.steps).toHaveLength(8)
      expect(route.steps.map((step) => step.title)).toEqual(requiredStepTitles)

      for (const step of route.steps) {
        expect(step.description.length).toBeGreaterThan(40)
        expect(step.documents.length).toBeGreaterThan(0)
        expect(step.sourceIds.length).toBeGreaterThan(0)
        expect(step.commonMistakes.length).toBeGreaterThan(0)
        expect(step.specialistHelp.length).toBeGreaterThan(30)
      }
    }
  })
})
