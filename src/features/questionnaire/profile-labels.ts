import {
  companionOptions,
  departureOptions,
  goalOptions,
  incomeOptions,
  passportOptions,
  preparedDocumentOptions,
  savingsOptions,
  schengenHistoryOptions,
  stayOptions,
  translationReadinessOptions,
  visaHistoryOptions,
  visaIssueOptions,
} from "@/features/questionnaire/profile-schema"
import type { UserProfile } from "@/domain/types"

export type ProfileSummaryRow = {
  label: string
  value: string
}

export function summarizeProfile(profile: UserProfile): ProfileSummaryRow[] {
  return [
    {
      label: "Цель",
      value: findLabel(goalOptions, profile.goal),
    },
    {
      label: "Когда уехать",
      value: findLabel(departureOptions, profile.departureWindow),
    },
    {
      label: "Срок",
      value: findLabel(stayOptions, profile.stayDuration),
    },
    {
      label: "Паспорт",
      value: findLabel(passportOptions, profile.passportStatus),
    },
    {
      label: "Визы",
      value: findLabel(visaHistoryOptions, profile.visaHistory),
    },
    {
      label: "Шенген",
      value: findLabel(schengenHistoryOptions, profile.schengenHistory),
    },
    {
      label: "Доход",
      value: `${profile.hasProvableIncome ? "можно подтвердить" : "не подтверждается"}; ${findLabel(
        incomeOptions,
        profile.monthlyIncomeLevel
      ).toLowerCase()}`,
    },
    {
      label: "Накопления",
      value: findLabel(savingsOptions, profile.savingsLevel),
    },
    {
      label: "Состав",
      value: profile.companions
        .map((value) => findLabel(companionOptions, value))
        .join(", "),
    },
    {
      label: "Переводы",
      value: findLabel(
        translationReadinessOptions,
        profile.translationReadiness
      ),
    },
    {
      label: "Готовые документы",
      value: profile.preparedDocuments.length
        ? profile.preparedDocuments
            .slice(0, 3)
            .map((value) => findLabel(preparedDocumentOptions, value))
            .join(", ")
        : "не отмечены",
    },
    {
      label: "Сложные визовые ситуации",
      value: profile.visaIssues.length
        ? profile.visaIssues
            .map((value) => findLabel(visaIssueOptions, value))
            .join(", ")
        : "не отмечены",
    },
  ]
}

function findLabel<TValue extends string>(
  options: { value: TValue; label: string }[],
  value: TValue
): string {
  return options.find((option) => option.value === value)?.label ?? value
}
