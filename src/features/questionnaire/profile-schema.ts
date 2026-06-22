import { z } from "zod"
import type {
  Companion,
  DepartureWindow,
  MoneyLevel,
  MonthlyIncomeLevel,
  PassportStatus,
  PreparedDocument,
  QuestionnaireDraft,
  RelocationGoal,
  SchengenHistory,
  StayDuration,
  TranslationReadiness,
  UserProfile,
  VisaHistory,
  VisaIssue,
} from "@/domain/types"

export const profileStorageKey = "relogator-profile"
export const questionnaireDraftStorageKey = "relogator-questionnaire-draft"

const goalSchema = z.enum([
  "quick_exit",
  "medium_stay",
  "residence",
  "remote_work",
  "local_work",
  "business",
  "family",
  "compare",
])
const departureWindowSchema = z.enum([
  "two_weeks",
  "one_month",
  "three_months",
  "one_year",
  "no_deadline",
])
const stayDurationSchema = z.enum([
  "up_to_one_month",
  "one_to_three_months",
  "three_to_six_months",
  "six_to_twelve_months",
  "more_than_year",
  "permanent_status",
])
const passportStatusSchema = z.enum([
  "more_than_18_months",
  "six_to_18_months",
  "less_than_6_months",
  "none",
])
const visaHistorySchema = z.enum([
  "none",
  "short_stay_visas_last_3y",
  "long_stay_or_residence_last_5y",
  "not_sure",
])
const schengenHistorySchema = z.enum([
  "valid_now",
  "expired_last_3y",
  "none",
  "not_sure",
])
const visaIssueSchema = z.enum([
  "schengen_refusal",
  "other_visa_refusal",
  "entry_refusal",
  "overstay",
  "ban_or_deportation",
  "not_sure",
])
const preparedDocumentSchema = z.enum([
  "income_proof",
  "bank_statements",
  "employment_contract",
  "business_registration",
  "criminal_record_certificate",
  "marriage_certificate",
  "birth_certificates",
  "education_documents",
  "pet_documents",
  "translations_or_apostille",
])
const companionSchema = z.enum([
  "alone",
  "partner",
  "children",
  "parents",
  "pets",
])
const incomeSchema = z.enum([
  "none",
  "under_one_thousand",
  "one_to_three_thousand",
  "three_thousand_plus",
])
const savingsSchema = z.enum(["none", "low", "medium", "high"])
const translationReadinessSchema = z.enum([
  "ready_self",
  "ready_with_list",
  "needs_specialist",
  "not_ready",
  "dont_understand",
])

export const userProfileSchema = z.object({
  goal: goalSchema,
  departureWindow: departureWindowSchema,
  stayDuration: stayDurationSchema,
  passportStatus: passportStatusSchema,
  visaHistory: visaHistorySchema.default("not_sure"),
  schengenHistory: schengenHistorySchema.default("not_sure"),
  visaIssues: z.array(visaIssueSchema).default([]),
  preparedDocuments: z.array(preparedDocumentSchema).default([]),
  companions: z.array(companionSchema).min(1),
  hasProvableIncome: z.boolean(),
  monthlyIncomeLevel: incomeSchema,
  savingsLevel: savingsSchema,
  hasEmploymentContract: z.boolean(),
  hasBusiness: z.boolean(),
  willingToOpenCompany: z.boolean(),
  translationReadiness: translationReadinessSchema,
  hasCriminalRecordCertificate: z.boolean(),
  needsSchool: z.boolean(),
  needsBankAccount: z.boolean(),
  valuesRussianSpeaking: z.boolean(),
  valuesLowCost: z.boolean(),
  valuesWarmClimate: z.boolean(),
}) satisfies z.ZodType<UserProfile>

export const questionnaireDraftSchema = z.object({
  goal: goalSchema.optional(),
  departureWindow: departureWindowSchema.optional(),
  stayDuration: stayDurationSchema.optional(),
  passportStatus: passportStatusSchema.optional(),
  visaHistory: visaHistorySchema.optional(),
  schengenHistory: schengenHistorySchema.optional(),
  visaIssues: z.array(visaIssueSchema).optional(),
  preparedDocuments: z.array(preparedDocumentSchema).optional(),
  companions: z.array(companionSchema).optional(),
  hasProvableIncome: z.boolean().optional(),
  monthlyIncomeLevel: incomeSchema.optional(),
  savingsLevel: savingsSchema.optional(),
  hasEmploymentContract: z.boolean().optional(),
  hasBusiness: z.boolean().optional(),
  willingToOpenCompany: z.boolean().optional(),
  translationReadiness: translationReadinessSchema.optional(),
  hasCriminalRecordCertificate: z.boolean().optional(),
  needsSchool: z.boolean().optional(),
  needsBankAccount: z.boolean().optional(),
  valuesRussianSpeaking: z.boolean().optional(),
  valuesLowCost: z.boolean().optional(),
  valuesWarmClimate: z.boolean().optional(),
}) satisfies z.ZodType<QuestionnaireDraft>

export const goalOptions: {
  value: RelocationGoal
  label: string
  hint: string
}[] = [
  {
    value: "quick_exit",
    label: "Уехать быстро",
    hint: "Нужен понятный первый шаг на 1-3 месяца.",
  },
  {
    value: "medium_stay",
    label: "Пожить несколько месяцев",
    hint: "Сравнить страны и не упереться в короткий срок.",
  },
  {
    value: "residence",
    label: "Получить ВНЖ или временный статус",
    hint: "Нужны документы, основание и сроки подготовки.",
  },
  {
    value: "remote_work",
    label: "Уехать с удаленной работой",
    hint: "Важно подтвердить доход и понимать налоговые риски.",
  },
  {
    value: "local_work",
    label: "Работать в местной компании",
    hint: "Нужен работодатель или рабочее основание.",
  },
  {
    value: "business",
    label: "Открыть бизнес",
    hint: "Подойдет ИП, компания или готовность открыть юрлицо.",
  },
  {
    value: "family",
    label: "Переехать с семьей",
    hint: "Проверим детей, документы и бытовые требования.",
  },
  {
    value: "compare",
    label: "Пока сравниваю варианты",
    hint: "Покажем несколько реалистичных маршрутов.",
  },
]

export const departureOptions: { value: DepartureWindow; label: string }[] = [
  { value: "two_weeks", label: "В течение 2 недель" },
  { value: "one_month", label: "В течение 1 месяца" },
  { value: "three_months", label: "В течение 3 месяцев" },
  { value: "one_year", label: "В течение года" },
  { value: "no_deadline", label: "Пока без срока" },
]

export const stayOptions: { value: StayDuration; label: string }[] = [
  { value: "up_to_one_month", label: "До 1 месяца" },
  { value: "one_to_three_months", label: "1-3 месяца" },
  { value: "three_to_six_months", label: "3-6 месяцев" },
  { value: "six_to_twelve_months", label: "6-12 месяцев" },
  { value: "more_than_year", label: "Больше года" },
  { value: "permanent_status", label: "Хочу путь к постоянному статусу" },
]

export const passportOptions: { value: PassportStatus; label: string }[] = [
  { value: "more_than_18_months", label: "Да, срок больше 18 месяцев" },
  { value: "six_to_18_months", label: "Да, срок 6-18 месяцев" },
  { value: "less_than_6_months", label: "Да, срок меньше 6 месяцев" },
  { value: "none", label: "Нет" },
]

export const visaHistoryOptions: { value: VisaHistory; label: string }[] = [
  { value: "none", label: "Визовой истории почти нет" },
  {
    value: "short_stay_visas_last_3y",
    label: "Были краткосрочные визы за последние 3 года",
  },
  {
    value: "long_stay_or_residence_last_5y",
    label: "Была долгосрочная виза, ВНЖ или похожий статус за 5 лет",
  },
  { value: "not_sure", label: "Не уверен, что это важно" },
]

export const schengenHistoryOptions: {
  value: SchengenHistory
  label: string
}[] = [
  { value: "valid_now", label: "Есть действующий шенген" },
  { value: "expired_last_3y", label: "Был шенген за последние 3 года" },
  { value: "none", label: "Шенгена не было" },
  { value: "not_sure", label: "Не уверен или нужно проверить даты" },
]

export const visaIssueOptions: { value: VisaIssue; label: string }[] = [
  { value: "schengen_refusal", label: "Был отказ по шенгенской визе" },
  { value: "other_visa_refusal", label: "Был отказ по другой визе" },
  { value: "entry_refusal", label: "Был отказ во въезде на границе" },
  { value: "overstay", label: "Была просрочка разрешенного срока" },
  { value: "ban_or_deportation", label: "Был запрет на въезд или депортация" },
  { value: "not_sure", label: "Не уверен, нужно проверить историю" },
]

export const preparedDocumentOptions: {
  value: PreparedDocument
  label: string
}[] = [
  { value: "income_proof", label: "Подтверждение дохода" },
  { value: "bank_statements", label: "Банковские выписки" },
  { value: "employment_contract", label: "Трудовой договор" },
  { value: "business_registration", label: "Документы ИП или компании" },
  { value: "criminal_record_certificate", label: "Справка о несудимости" },
  { value: "marriage_certificate", label: "Свидетельство о браке" },
  { value: "birth_certificates", label: "Свидетельства о рождении детей" },
  { value: "education_documents", label: "Дипломы и документы об образовании" },
  { value: "pet_documents", label: "Документы на животное" },
  {
    value: "translations_or_apostille",
    label: "Переводы, нотариальные копии или апостиль",
  },
]

export const companionOptions: { value: Companion; label: string }[] = [
  { value: "alone", label: "Еду один" },
  { value: "partner", label: "С партнером" },
  { value: "children", label: "С детьми" },
  { value: "parents", label: "С родителями" },
  { value: "pets", label: "С животными" },
]

export const incomeOptions: { value: MonthlyIncomeLevel; label: string }[] = [
  { value: "none", label: "Нет подтверждаемого дохода" },
  { value: "under_one_thousand", label: "До 1000 долларов/евро" },
  { value: "one_to_three_thousand", label: "1000-3000 долларов/евро" },
  { value: "three_thousand_plus", label: "Больше 3000 долларов/евро" },
]

export const savingsOptions: { value: MoneyLevel; label: string }[] = [
  { value: "none", label: "Почти нет" },
  { value: "low", label: "Небольшой запас" },
  { value: "medium", label: "Средний запас" },
  { value: "high", label: "Есть запас на несколько месяцев" },
]

export const translationReadinessOptions: {
  value: TranslationReadiness
  label: string
}[] = [
  { value: "ready_self", label: "Готов заняться сам" },
  { value: "ready_with_list", label: "Готов, если будет список" },
  { value: "needs_specialist", label: "Нужна помощь специалиста" },
  { value: "not_ready", label: "Пока не готов" },
  { value: "dont_understand", label: "Не понимаю, что это значит" },
]
