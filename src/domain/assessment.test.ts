import { describe, expect, it } from "vitest"

import { assessRoutes, simulateAnswerImpact } from "./assessment"
import { routes } from "./routes"
import type { UserProfile } from "./types"

const baseProfile: UserProfile = {
  goal: "quick_exit",
  departureWindow: "three_months",
  stayDuration: "one_to_three_months",
  passportStatus: "more_than_18_months",
  companions: ["alone"],
  hasProvableIncome: false,
  monthlyIncomeLevel: "none",
  savingsLevel: "medium",
  hasEmploymentContract: false,
  hasBusiness: false,
  willingToOpenCompany: false,
  translationReadiness: "ready_with_list",
  hasCriminalRecordCertificate: false,
  needsSchool: false,
  needsBankAccount: false,
  valuesRussianSpeaking: true,
  valuesLowCost: true,
  valuesWarmClimate: false,
}

function profile(overrides: Partial<UserProfile>): UserProfile {
  return { ...baseProfile, ...overrides }
}

describe("assessRoutes", () => {
  it("adds scale assessments and availability status to every route", () => {
    const results = assessRoutes(baseProfile)

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].status).toBeDefined()
    expect(Object.keys(results[0].scales)).toEqual([
      "documents",
      "cost",
      "approvalRisk",
      "speed",
      "adaptation",
    ])
    expect(results[0].scales.approvalRisk.label).toContain(
      "риск отказа или дополнительного запроса"
    )
  })

  it("keeps visa-free short-stay routes simple for a short move without residence needs", () => {
    const results = assessRoutes(
      profile({
        goal: "quick_exit",
        stayDuration: "one_to_three_months",
      })
    )

    expect(results.length).toBeGreaterThanOrEqual(3)
    expect(results[0].difficulty.level).toBeLessThanOrEqual(2)
    expect(results[0].whyFits.join(" ")).toContain("без визы")
  })

  it("matches remote-work routes when the user can prove income", () => {
    const results = assessRoutes(
      profile({
        goal: "remote_work",
        stayDuration: "six_to_twelve_months",
        hasProvableIncome: true,
        monthlyIncomeLevel: "one_to_three_thousand",
        savingsLevel: "medium",
      })
    )

    expect(results.some((item) => item.route.supports.remoteWork)).toBe(true)
    expect(results[0].difficulty.level).toBeLessThanOrEqual(3)
    expect(results[0].whyFits.join(" ")).toMatch(/доход|удален/)
  })

  it("keeps family-incompatible routes visible only as blocked", () => {
    const results = assessRoutes(
      profile({
        goal: "family",
        stayDuration: "six_to_twelve_months",
        companions: ["partner", "children"],
        hasProvableIncome: true,
        monthlyIncomeLevel: "one_to_three_thousand",
        needsSchool: true,
      })
    )

    expect(results.length).toBeGreaterThan(0)
    expect(
      results.every(
        (item) => item.route.supports.family || item.status === "blocked"
      )
    ).toBe(true)
    expect(results[0].documents).toContain(
      "Свидетельства о браке и рождении детей"
    )
  })

  it("keeps blocked routes visible when the passport is valid for less than six months", () => {
    const results = assessRoutes(
      profile({
        passportStatus: "less_than_6_months",
      })
    )

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((item) => item.status === "blocked")).toBe(true)
    expect(results[0].blockers.join(" ")).toContain("паспорт")
  })

  it("keeps income-based routes as conditional when income cannot be proved", () => {
    const results = assessRoutes(
      profile({
        goal: "remote_work",
        stayDuration: "six_to_twelve_months",
        hasProvableIncome: false,
        monthlyIncomeLevel: "none",
      })
    )

    expect(results.length).toBeGreaterThan(0)
    expect(
      results.some(
        (item) =>
          item.route.requirements.provableIncome === true &&
          item.status === "conditional"
      )
    ).toBe(true)
  })

  it("prioritizes routes that can be prepared within two weeks for urgent departure", () => {
    const results = assessRoutes(
      profile({
        departureWindow: "two_weeks",
        stayDuration: "one_to_three_months",
      })
    )

    expect(results[0].route.timeline.preparationDays).toBeLessThanOrEqual(14)
    expect(results[0].blockers.join(" ")).not.toContain("дольше двух недель")
  })

  it("keeps only pet-compatible routes when the user relocates with a pet", () => {
    const results = assessRoutes(
      profile({
        companions: ["pets"],
        goal: "compare",
      })
    )

    expect(results.length).toBeGreaterThan(0)
    expect(
      results.some(
        (item) => !item.route.supports.pets && item.status === "blocked"
      )
    ).toBe(true)
  })

  it("surfaces business routes when the user has or is ready to open a business", () => {
    const results = assessRoutes(
      profile({
        goal: "business",
        stayDuration: "more_than_year",
        hasBusiness: true,
        willingToOpenCompany: true,
        hasProvableIncome: true,
        monthlyIncomeLevel: "three_thousand_plus",
        savingsLevel: "high",
      })
    )

    const businessResults = results.filter(
      (item) => item.route.supports.business
    )

    expect(businessResults.length).toBeGreaterThan(0)
    expect(businessResults[0].difficulty.level).toBeGreaterThanOrEqual(3)
    expect(businessResults[0].documents.join(" ")).toContain(
      "регистрации бизнеса"
    )
    expect(routes.some((route) => route.supports.business)).toBe(true)
  })

  it("allows a local-work route with an employment contract and no business entity", () => {
    const results = assessRoutes(
      profile({
        goal: "local_work",
        stayDuration: "six_to_twelve_months",
        hasEmploymentContract: true,
        hasBusiness: false,
        willingToOpenCompany: false,
        hasProvableIncome: true,
        monthlyIncomeLevel: "one_to_three_thousand",
        savingsLevel: "medium",
      })
    )

    expect(
      results.some(
        (item) => item.route.id === "serbia-temporary-residence-business-work"
      )
    ).toBe(true)
  })

  it("does not add child birth certificates for a partner-only relocation", () => {
    const results = assessRoutes(
      profile({
        goal: "remote_work",
        stayDuration: "six_to_twelve_months",
        companions: ["partner"],
        hasProvableIncome: true,
        monthlyIncomeLevel: "one_to_three_thousand",
      })
    )

    expect(results[0].documents).not.toContain(
      "Свидетельства о браке и рождении детей"
    )
    expect(results[0].documents).toContain(
      "Свидетельство о браке или документ о партнерстве"
    )
  })

  it("shows that a criminal record certificate can open residence routes", () => {
    const impact = simulateAnswerImpact(
      profile({
        goal: "residence",
        stayDuration: "six_to_twelve_months",
        hasProvableIncome: true,
        monthlyIncomeLevel: "three_thousand_plus",
        savingsLevel: "high",
        hasEmploymentContract: true,
        hasCriminalRecordCertificate: false,
      }),
      "hasCriminalRecordCertificate",
      true,
      routes
    )

    expect(impact.changedRoutes.length).toBeGreaterThan(0)
    expect(impact.summary).toContain("справ")
  })

  it("shows that a longer preparation window makes routes easier", () => {
    const impact = simulateAnswerImpact(
      profile({
        departureWindow: "two_weeks",
        goal: "residence",
        stayDuration: "six_to_twelve_months",
        hasProvableIncome: true,
        monthlyIncomeLevel: "one_to_three_thousand",
        savingsLevel: "medium",
      }),
      "departureWindow",
      "three_months",
      routes
    )

    expect(impact.changedRoutes.length).toBeGreaterThan(0)
    expect(impact.summary).toContain("3 месяцев")
  })

  it("shows that confirming income opens remote-work and income routes", () => {
    const impact = simulateAnswerImpact(
      profile({
        goal: "remote_work",
        stayDuration: "six_to_twelve_months",
        hasProvableIncome: false,
        monthlyIncomeLevel: "none",
      }),
      "hasProvableIncome",
      true,
      routes
    )

    expect(impact.changedRoutes.length).toBeGreaterThan(0)
    expect(impact.summary).toContain("доход")
  })
})
