import type { RouteAssessment } from "@/domain/types"

export type RouteMetricSummary = {
  label: string
  value: string
  description: string
}

export function buildRouteMetricSummaries(
  assessment: RouteAssessment
): RouteMetricSummary[] {
  return [
    {
      label: "Сложность переезда",
      value: `${assessment.difficulty.level}/5 - ${assessment.difficulty.label}`,
      description:
        "Общая оценка по документам, срокам, деньгам и условиям из анкеты.",
    },
    {
      label: "Документы",
      value: `${getDocumentLoadLabel(assessment.documents.length)}: ${assessment.documents.length} ${pluralizePoint(assessment.documents.length)}`,
      description:
        "Количество ключевых пунктов в комплекте, а не оценка из пяти.",
    },
    {
      label: "Срок подготовки",
      value: formatPreparationRange(assessment.route.timeline.preparationDays),
      description:
        "Ориентир до выезда или подачи по маршруту, не срок адаптации.",
    },
    {
      label: "Расходы на старт переезда",
      value: `${getCostLevelLabel(assessment.route.cost.level)} расходы`,
      description: `${assessment.route.cost.label}. Это не индекс стоимости жизни в стране.`,
    },
  ]
}

export function getDocumentLoadLabel(count: number) {
  if (count <= 3) {
    return "мало"
  }

  if (count <= 5) {
    return "средне"
  }

  return "много"
}

export function formatPreparationRange(days: number) {
  if (days <= 7) {
    return "1-7 дней"
  }

  if (days <= 14) {
    return "1-2 недели"
  }

  if (days <= 30) {
    return "2-4 недели"
  }

  if (days <= 45) {
    return "1-1,5 месяца"
  }

  if (days <= 90) {
    return "1,5-3 месяца"
  }

  return "3+ месяца"
}

function getCostLevelLabel(level: RouteAssessment["route"]["cost"]["level"]) {
  if (level === "low") {
    return "низкие"
  }

  if (level === "medium") {
    return "средние"
  }

  return "высокие"
}

function pluralizePoint(count: number) {
  const normalized = Math.abs(count) % 100
  const lastDigit = normalized % 10

  if (normalized > 10 && normalized < 20) {
    return "пунктов"
  }

  if (lastDigit === 1) {
    return "пункт"
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "пункта"
  }

  return "пунктов"
}
