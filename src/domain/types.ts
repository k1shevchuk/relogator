export type CountryCode = string

export type PublicationStatus =
  | "draft"
  | "reviewed"
  | "partner_reviewed"
  | "stale"
  | "archived"

export type CountryResearchStatus =
  | "reviewed"
  | "needs_review"
  | "stale"
  | "reference_only"

export type ConfidenceLevel = "low" | "medium" | "high"

export type RelocationGoal =
  | "quick_exit"
  | "medium_stay"
  | "residence"
  | "remote_work"
  | "local_work"
  | "business"
  | "family"
  | "compare"

export type DepartureWindow =
  | "two_weeks"
  | "one_month"
  | "three_months"
  | "one_year"
  | "no_deadline"

export type StayDuration =
  | "up_to_one_month"
  | "one_to_three_months"
  | "three_to_six_months"
  | "six_to_twelve_months"
  | "more_than_year"
  | "permanent_status"

export type PassportStatus =
  | "more_than_18_months"
  | "six_to_18_months"
  | "less_than_6_months"
  | "none"

export type VisaHistory =
  | "none"
  | "short_stay_visas_last_3y"
  | "long_stay_or_residence_last_5y"
  | "not_sure"

export type SchengenHistory =
  | "valid_now"
  | "expired_last_3y"
  | "none"
  | "not_sure"

export type VisaIssue =
  | "schengen_refusal"
  | "other_visa_refusal"
  | "entry_refusal"
  | "overstay"
  | "ban_or_deportation"
  | "not_sure"

export type PreparedDocument =
  | "income_proof"
  | "bank_statements"
  | "employment_contract"
  | "business_registration"
  | "criminal_record_certificate"
  | "marriage_certificate"
  | "birth_certificates"
  | "education_documents"
  | "pet_documents"
  | "translations_or_apostille"

export type Companion = "alone" | "partner" | "children" | "parents" | "pets"

export type MoneyLevel = "none" | "low" | "medium" | "high"

export type MonthlyIncomeLevel =
  | "none"
  | "under_one_thousand"
  | "one_to_three_thousand"
  | "three_thousand_plus"

export type TranslationReadiness =
  | "ready_self"
  | "ready_with_list"
  | "needs_specialist"
  | "not_ready"
  | "dont_understand"

export type QuestionnaireDraft = {
  goal?: RelocationGoal
  departureWindow?: DepartureWindow
  stayDuration?: StayDuration
  passportStatus?: PassportStatus
  visaHistory?: VisaHistory
  schengenHistory?: SchengenHistory
  visaIssues?: VisaIssue[]
  preparedDocuments?: PreparedDocument[]
  companions?: Companion[]
  hasProvableIncome?: boolean
  monthlyIncomeLevel?: MonthlyIncomeLevel
  savingsLevel?: MoneyLevel
  hasEmploymentContract?: boolean
  hasBusiness?: boolean
  willingToOpenCompany?: boolean
  translationReadiness?: TranslationReadiness
  hasCriminalRecordCertificate?: boolean
  needsSchool?: boolean
  needsBankAccount?: boolean
  valuesRussianSpeaking?: boolean
  valuesLowCost?: boolean
  valuesWarmClimate?: boolean
}

export type UserProfile = Required<QuestionnaireDraft>

export type Country = {
  code: CountryCode
  name: string
  slug: string
  status: CountryResearchStatus
  summary: string
  sourceIds: string[]
  lastReviewedAt: string
}

export type SourceType =
  | "official_body"
  | "consulate"
  | "law"
  | "statistics"
  | "government_portal"
  | "partner"
  | "editorial_note"

export type RouteSource = {
  id: string
  title: string
  url: string
  sourceType: SourceType
  countryCode: CountryCode
  language:
    | "en"
    | "ru"
    | "hy"
    | "ka"
    | "sr"
    | "kk"
    | "tr"
    | "uz"
    | "vi"
    | "th"
    | "ar"
    | "el"
    | "es"
    | "pt"
    | "de"
    | "fr"
    | "pl"
    | "bg"
    | "hu"
    | "it"
  lastReviewedAt: string
  description: string
  confidence: ConfidenceLevel
  appliesToCitizenship: ["RU"]
}

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export type CostLevel = "low" | "medium" | "high"

export type RouteStep = {
  title: string
  description: string
  documents: string[]
  sourceIds: string[]
  commonMistakes: string[]
  specialistHelp: string
}

export type RouteDefinition = {
  id: string
  countryCode: CountryCode
  title: string
  shortDescription: string
  entryType: "visa_free" | "residence_permit" | "temporary_residence"
  goals: RelocationGoal[]
  stayDurations: StayDuration[]
  publicationStatus: PublicationStatus
  confidence: ConfidenceLevel
  lastReviewedAt: string
  baseDifficulty: DifficultyLevel
  requirements: {
    minPassportMonths: number
    provableIncome?: boolean
    minimumMonthlyIncomeLevel?: MonthlyIncomeLevel
    minimumSavingsLevel?: MoneyLevel
    employmentContract?: boolean
    businessBasis?: boolean
    businessOrEmploymentBasis?: boolean
    translations?: boolean
    criminalRecordCertificate?: boolean
  }
  supports: {
    family: boolean
    children: boolean
    pets: boolean
    remoteWork: boolean
    business: boolean
    bankAccount: boolean
    lowCost: boolean
    warmClimate: boolean
    russianSpeaking: boolean
  }
  timeline: {
    preparationDays: number
    label: string
  }
  cost: {
    level: CostLevel
    label: string
  }
  documents: string[]
  sourceIds: string[]
  steps: RouteStep[]
  risks: string[]
}

export type RequirementDefinition = {
  id: string
  title: string
  affects: AssessmentScaleKey[]
  config: Partial<RouteDefinition["requirements"]>
  sourceIds: string[]
  lastReviewedAt: string
}

export type DocumentDefinition = {
  id: string
  title: string
  category:
    | "identity"
    | "finance"
    | "family"
    | "business"
    | "medical"
    | "general"
  sourceIds: string[]
  lastReviewedAt: string
}

export type DataRouteDefinition = Omit<
  RouteDefinition,
  "documents" | "requirements"
> & {
  documentIds: string[]
  requirementIds: string[]
}

export type RouteAssessment = {
  route: RouteDefinition
  country: Country
  status: RouteAvailabilityStatus
  statusLabel: string
  difficulty: {
    level: DifficultyLevel
    label: string
  }
  scales: AssessmentScales
  whyFits: string[]
  blockers: string[]
  unlocks: string[]
  documents: string[]
  timeline: string
  cost: string
  lastReviewedAt: string
  sources: RouteSource[]
}

export type RouteAvailabilityStatus =
  | "available"
  | "conditional"
  | "blocked"
  | "unknown"

export type AssessmentScaleKey =
  | "documents"
  | "cost"
  | "approvalRisk"
  | "speed"
  | "adaptation"

export type AssessmentScale = {
  level: DifficultyLevel
  label: string
  reasons: string[]
}

export type AssessmentScales = Record<AssessmentScaleKey, AssessmentScale>

export type AnswerImpact<TField extends keyof UserProfile = keyof UserProfile> =
  {
    field: TField
    value: UserProfile[TField]
    summary: string
    changedRoutes: {
      routeId: string
      countryName: string
      routeTitle: string
      beforeStatus: RouteAvailabilityStatus
      afterStatus: RouteAvailabilityStatus
      beforeDifficulty: DifficultyLevel
      afterDifficulty: DifficultyLevel
      change: "opened" | "easier" | "harder" | "blocked" | "changed"
    }[]
  }
