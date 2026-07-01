import { describe, expect, test } from "vitest"
import {
  partnerLeadSubmissionSchema,
  questionnaireSubmissionSchema,
  specialistRequestSubmissionSchema,
} from "./server-schemas"

const validProfile = {
  goal: "remote_work",
  departureWindow: "three_months",
  stayDuration: "six_to_twelve_months",
  passportStatus: "more_than_18_months",
  visaHistory: "not_sure",
  schengenHistory: "not_sure",
  visaIssues: [],
  preparedDocuments: [],
  companions: ["alone"],
  hasProvableIncome: true,
  monthlyIncomeLevel: "three_thousand_plus",
  savingsLevel: "high",
  hasEmploymentContract: true,
  hasBusiness: false,
  willingToOpenCompany: false,
  translationReadiness: "ready_with_list",
  hasCriminalRecordCertificate: false,
  needsSchool: false,
  needsBankAccount: true,
  valuesRussianSpeaking: false,
  valuesLowCost: false,
  valuesWarmClimate: true,
}

describe("user data API schemas", () => {
  test("keeps only known questionnaire profile fields", () => {
    const result = questionnaireSubmissionSchema.parse({
      profile: {
        ...validProfile,
        passport_number: "123456789",
        bank_account_number: "secret",
      },
    })

    expect(result.profile).not.toHaveProperty("passport_number")
    expect(result.profile).not.toHaveProperty("bank_account_number")
  })

  test("validates specialist request payload with optional safe profile", () => {
    const result = specialistRequestSubmissionSchema.safeParse({
      routeId: "serbia-residence-business",
      routeTitle: "ВНЖ через бизнес",
      countryName: "Сербия",
      name: "Анна",
      contact: "anna@example.com",
      question: "Какие документы лучше подготовить первыми?",
      profile: validProfile,
    })

    expect(result.success).toBe(true)
  })

  test("rejects specialist request without consent-safe contact fields", () => {
    const result = specialistRequestSubmissionSchema.safeParse({
      routeId: "route",
      routeTitle: "Маршрут",
      countryName: "Страна",
      name: "",
      contact: "",
      question: "short",
    })

    expect(result.success).toBe(false)
  })

  test("validates public partner lead payload and removes honeypot field", () => {
    const result = partnerLeadSubmissionSchema.parse({
      organizationName: "Relocation Helper",
      contactName: "Иван",
      contact: "ivan@example.com",
      website: "https://example.com",
      countries: "Сербия, Армения, Турция",
      services: "Визы, ВНЖ, документы",
      message: "Хотим обсудить партнерство и обработку обращений клиентов.",
      consent: true,
      websiteUrl: "",
    })

    expect(result.organizationName).toBe("Relocation Helper")
    expect(result).not.toHaveProperty("websiteUrl")
  })

  test("rejects partner lead without consent or with filled honeypot", () => {
    const withoutConsent = partnerLeadSubmissionSchema.safeParse({
      organizationName: "Agency",
      contactName: "Иван",
      contact: "ivan@example.com",
      countries: "Сербия",
      services: "ВНЖ",
      message: "Хотим обсудить партнерство по обращениям пользователей.",
      consent: false,
    })
    const botPayload = partnerLeadSubmissionSchema.safeParse({
      organizationName: "Agency",
      contactName: "Иван",
      contact: "ivan@example.com",
      countries: "Сербия",
      services: "ВНЖ",
      message: "Хотим обсудить партнерство по обращениям пользователей.",
      consent: true,
      websiteUrl: "spam",
    })

    expect(withoutConsent.success).toBe(false)
    expect(botPayload.success).toBe(false)
  })
})
