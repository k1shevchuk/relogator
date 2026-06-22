import type { QuestionnaireDraft } from "./types"

export type ReadinessTone = "positive" | "warning" | "risk" | "neutral"

export type ReadinessHint = {
  tone: ReadinessTone
  title: string
  description: string
}

export type ProfileReadiness = {
  score: number
  label: string
  description: string
}

export function calculateProfileReadiness(
  draft: QuestionnaireDraft
): ProfileReadiness {
  let score = 0

  const completedCoreAnswers = [
    Boolean(draft.goal),
    Boolean(draft.departureWindow),
    Boolean(draft.stayDuration),
    Boolean(draft.passportStatus),
    Boolean(draft.companions?.length),
    draft.hasProvableIncome !== undefined,
    Boolean(draft.monthlyIncomeLevel),
    Boolean(draft.savingsLevel),
    Boolean(draft.translationReadiness),
  ].filter(Boolean).length

  score += completedCoreAnswers * 7

  if (draft.passportStatus === "more_than_18_months") {
    score += 12
  } else if (draft.passportStatus === "six_to_18_months") {
    score += 7
  } else if (draft.passportStatus === "less_than_6_months") {
    score += 2
  }

  if (
    draft.departureWindow === "three_months" ||
    draft.departureWindow === "one_year" ||
    draft.departureWindow === "no_deadline"
  ) {
    score += 8
  } else if (draft.departureWindow === "two_weeks") {
    score -= 6
  }

  if (draft.hasProvableIncome && draft.monthlyIncomeLevel !== "none") {
    score += 8
  }

  if (draft.savingsLevel === "medium" || draft.savingsLevel === "high") {
    score += 6
  }

  if (
    draft.translationReadiness === "ready_self" ||
    draft.translationReadiness === "ready_with_list"
  ) {
    score += 5
  }

  if (draft.schengenHistory === "valid_now") {
    score += 4
  } else if (draft.schengenHistory === "expired_last_3y") {
    score += 3
  }

  if (draft.visaHistory === "long_stay_or_residence_last_5y") {
    score += 4
  } else if (draft.visaHistory === "short_stay_visas_last_3y") {
    score += 3
  }

  score += Math.min(8, (draft.preparedDocuments?.length ?? 0) * 2)

  const meaningfulIssues = (draft.visaIssues ?? []).filter(
    (issue) => issue !== "not_sure"
  )

  if (meaningfulIssues.length > 0) {
    score -= 6
  }

  if (draft.visaIssues?.includes("ban_or_deportation")) {
    score -= 12
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)))

  if (normalizedScore >= 75) {
    return {
      score: normalizedScore,
      label: "сильная готовность",
      description:
        "Вводных уже достаточно для подбора маршрутов и списка следующих действий.",
    }
  }

  if (normalizedScore >= 50) {
    return {
      score: normalizedScore,
      label: "средняя готовность",
      description:
        "Подбор уже полезен, но часть ответов может заметно изменить маршруты.",
    }
  }

  if (normalizedScore >= 25) {
    return {
      score: normalizedScore,
      label: "базовая готовность",
      description:
        "Заполните ключевые документы, визовую историю и финансы, чтобы сузить варианты.",
    }
  }

  return {
    score: normalizedScore,
    label: "нужно больше вводных",
    description:
      "Пока данных мало: начните с цели, сроков, паспорта, состава и дохода.",
  }
}

export function buildLiveQuestionnaireHints(
  draft: QuestionnaireDraft
): ReadinessHint[] {
  const hints: ReadinessHint[] = []

  if (!draft.goal) {
    hints.push({
      tone: "neutral",
      title: "Сначала зафиксируйте цель",
      description:
        "Один и тот же маршрут может быть простым для короткого въезда и сложным для ВНЖ.",
    })
  }

  if (!draft.passportStatus) {
    hints.push({
      tone: "neutral",
      title: "Срок паспорта сильно влияет на подбор",
      description:
        "Чем больше запас до окончания паспорта, тем меньше маршрутов отсеется на первом шаге.",
    })
  } else if (draft.passportStatus === "more_than_18_months") {
    hints.push({
      tone: "positive",
      title: "Хороший запас по паспорту",
      description:
        "Такой срок обычно оставляет больше пространства для виз, ВНЖ и продлений.",
    })
  } else if (draft.passportStatus === "less_than_6_months") {
    hints.push({
      tone: "risk",
      title: "Паспорт может закрыть много вариантов",
      description:
        "Для части маршрутов сначала понадобится новый загранпаспорт или другой план сроков.",
    })
  } else if (draft.passportStatus === "none") {
    hints.push({
      tone: "risk",
      title: "Без загранпаспорта подбор будет ограничен",
      description:
        "Сначала стоит заложить время на оформление паспорта и только потом покупать билеты.",
    })
  }

  if (draft.departureWindow === "two_weeks") {
    hints.push({
      tone: "warning",
      title: "Срочный выезд снижает выбор",
      description:
        "Быстрые маршруты остаются, но визы и ВНЖ с длинной подготовкой станут тяжелее.",
    })
  } else if (
    draft.departureWindow === "three_months" ||
    draft.departureWindow === "one_year" ||
    draft.departureWindow === "no_deadline"
  ) {
    hints.push({
      tone: "positive",
      title: "Есть время подготовить документы",
      description:
        "Запас времени помогает с переводами, справками, выписками и записью на подачу.",
    })
  }

  if (draft.hasProvableIncome === false) {
    hints.push({
      tone: "warning",
      title: "Без подтверждаемого дохода меньше долгих маршрутов",
      description:
        "Выписки, договор, справка работодателя или документы бизнеса часто делают путь понятнее.",
    })
  } else if (draft.hasProvableIncome && draft.monthlyIncomeLevel !== "none") {
    hints.push({
      tone: "positive",
      title: "Подтверждаемый доход помогает",
      description:
        "Это не гарантия одобрения, но такой ответ открывает больше маршрутов с финансовым основанием.",
    })
  }

  if (
    draft.schengenHistory === "valid_now" ||
    draft.schengenHistory === "expired_last_3y"
  ) {
    hints.push({
      tone: "positive",
      title: "Визовая история может помочь при проверке",
      description:
        "Действующий или недавний шенген не гарантирует результат, но его стоит учитывать в анкете.",
    })
  }

  const issues = (draft.visaIssues ?? []).filter(
    (issue) => issue !== "not_sure"
  )

  if (issues.length > 0) {
    hints.push({
      tone: "risk",
      title: "Сложную визовую историю лучше проверить отдельно",
      description:
        "Отказы, просрочки и запреты не всегда закрывают маршрут, но повышают цену ошибки.",
    })
  }

  if ((draft.preparedDocuments?.length ?? 0) >= 3) {
    hints.push({
      tone: "positive",
      title: "Часть документов уже понятна",
      description:
        "Готовые выписки, договоры, справки и семейные документы ускоряют подготовку маршрута.",
    })
  }

  if (
    draft.translationReadiness === "not_ready" ||
    draft.translationReadiness === "dont_understand"
  ) {
    hints.push({
      tone: "warning",
      title: "Переводы и заверения лучше разобрать заранее",
      description:
        "Для ВНЖ, работы, бизнеса и семейных маршрутов этот блок часто влияет на сроки.",
    })
  }

  if (hints.length === 0) {
    return [
      {
        tone: "neutral",
        title: "Заполняйте анкету по шагам",
        description:
          "Подсказки обновятся после ответов о сроках, паспорте, финансах и документах.",
      },
    ]
  }

  return hints
}
