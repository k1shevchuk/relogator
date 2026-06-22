import type { RouteAssessment } from "@/domain/types"

export type ResultFitBucket = "best" | "medium" | "weak" | "blocked"

export const resultFitSections: {
  bucket: ResultFitBucket
  title: string
  description: string
  badge: string
}[] = [
  {
    bucket: "best",
    title: "Наиболее подходящие маршруты",
    description:
      "Лучшие совпадения по анкете: можно начинать сейчас, сложность низкая.",
    badge: "лучше всего",
  },
  {
    bucket: "medium",
    title: "Подходящие, но сложнее",
    description:
      "Реалистичные варианты, где нужно внимательнее проверить документы, сроки или деньги.",
    badge: "средне",
  },
  {
    bucket: "weak",
    title: "Менее подходящие",
    description:
      "Маршруты с заметными условиями, неопределенностью или высокой сложностью.",
    badge: "слабее",
  },
  {
    bucket: "blocked",
    title: "Не подходят сейчас",
    description:
      "Варианты, которые текущая анкета блокирует. Они остаются видимыми, чтобы было понятно, что мешает.",
    badge: "не подходит",
  },
]

export function getRouteFitBucket(
  assessment: Pick<RouteAssessment, "status" | "difficulty">
): ResultFitBucket {
  if (assessment.status === "blocked") {
    return "blocked"
  }

  if (assessment.status === "available" && assessment.difficulty.level <= 2) {
    return "best"
  }

  if (
    assessment.difficulty.level <= 3 &&
    (assessment.status === "available" || assessment.status === "conditional")
  ) {
    return "medium"
  }

  return "weak"
}

export function groupResultsByFit(results: RouteAssessment[]) {
  const groups: Record<ResultFitBucket, RouteAssessment[]> = {
    best: [],
    medium: [],
    weak: [],
    blocked: [],
  }

  for (const assessment of results) {
    groups[getRouteFitBucket(assessment)].push(assessment)
  }

  return groups
}
