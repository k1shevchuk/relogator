import { countries } from "./data-catalog"
import type { Country } from "./types"

export const countryStatusLabels: Record<Country["status"], string> = {
  reviewed: "страна проверена",
  needs_review: "нужна ручная проверка",
  stale: "нужна актуализация",
  reference_only: "только справочно",
}

export { countries }

export type ReviewFreshness = {
  label: string
  tone: "warning" | "risk"
}

const recheckAfterDays = 60
const staleAfterDays = 90
const millisecondsPerDay = 24 * 60 * 60 * 1000

export function getReviewFreshness(
  lastReviewedAt: string,
  now = new Date()
): ReviewFreshness | null {
  const reviewedAt = new Date(`${lastReviewedAt}T00:00:00.000Z`)

  if (Number.isNaN(reviewedAt.getTime())) {
    return null
  }

  const ageDays = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      reviewedAt.getTime()) /
      millisecondsPerDay
  )

  if (ageDays >= staleAfterDays) {
    return {
      label: "Проверка старше 3 месяцев: перед действием нужно сверить источник заново.",
      tone: "risk",
    }
  }

  if (ageDays >= recheckAfterDays) {
    return {
      label: "Проверка старше 2 месяцев: перед подачей стоит перепроверить источник.",
      tone: "warning",
    }
  }

  return null
}

export function getCountry(code: Country["code"]): Country {
  const country = countries.find((item) => item.code === code)

  if (!country) {
    throw new Error(`Unknown country code: ${code}`)
  }

  return country
}
