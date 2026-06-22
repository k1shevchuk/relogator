import { describe, expect, it } from "vitest"

import {
  buildLiveQuestionnaireHints,
  calculateProfileReadiness,
} from "./questionnaire-readiness"
import type { QuestionnaireDraft } from "./types"

const strongDraft: QuestionnaireDraft = {
  goal: "remote_work",
  departureWindow: "three_months",
  stayDuration: "six_to_twelve_months",
  passportStatus: "more_than_18_months",
  visaHistory: "short_stay_visas_last_3y",
  schengenHistory: "valid_now",
  visaIssues: [],
  preparedDocuments: ["income_proof", "bank_statements", "employment_contract"],
  companions: ["alone"],
  hasProvableIncome: true,
  monthlyIncomeLevel: "one_to_three_thousand",
  savingsLevel: "medium",
  translationReadiness: "ready_with_list",
}

describe("questionnaire readiness", () => {
  it("scores a complete low-risk draft as strong readiness", () => {
    const result = calculateProfileReadiness(strongDraft)

    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.label).toBe("сильная готовность")
  })

  it("warns about urgent departure and weak passport inputs", () => {
    const draft: QuestionnaireDraft = {
      goal: "residence",
      departureWindow: "two_weeks",
      stayDuration: "more_than_year",
      passportStatus: "less_than_6_months",
      companions: ["alone"],
      hasProvableIncome: false,
      monthlyIncomeLevel: "none",
      savingsLevel: "low",
      translationReadiness: "not_ready",
    }

    const hints = buildLiveQuestionnaireHints(draft)
    const titles = hints.map((hint) => hint.title).join(" ")

    expect(hints.some((hint) => hint.tone === "risk")).toBe(true)
    expect(titles).toContain("Паспорт")
    expect(titles).toContain("Срочный выезд")
  })

  it("does not present readiness as a visa approval chance", () => {
    const hints = buildLiveQuestionnaireHints(strongDraft)
    const text = hints
      .map((hint) => `${hint.title} ${hint.description}`)
      .join(" ")
      .toLowerCase()

    expect(text).not.toContain("вероятность одобрения")
  })
})
