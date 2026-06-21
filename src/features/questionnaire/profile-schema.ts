import { z } from "zod"
import type {
  Companion,
  DepartureWindow,
  MoneyLevel,
  MonthlyIncomeLevel,
  PassportStatus,
  QuestionnaireDraft,
  RelocationGoal,
  StayDuration,
  TranslationReadiness,
  UserProfile,
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
