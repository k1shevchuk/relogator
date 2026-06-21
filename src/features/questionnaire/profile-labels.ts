import {
  companionOptions,
  departureOptions,
  goalOptions,
  incomeOptions,
  passportOptions,
  savingsOptions,
  stayOptions,
  translationReadinessOptions,
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
  ]
}

function findLabel<TValue extends string>(
  options: { value: TValue; label: string }[],
  value: TValue
): string {
  return options.find((option) => option.value === value)?.label ?? value
}
