import { countries } from "./data-catalog"
import type { Country } from "./types"

export const countryStatusLabels: Record<Country["status"], string> = {
  reviewed: "страна проверена",
  needs_review: "нужна ручная проверка",
  stale: "правила могли устареть",
  reference_only: "только справочно",
}

export { countries }

export function getCountry(code: Country["code"]): Country {
  const country = countries.find((item) => item.code === code)

  if (!country) {
    throw new Error(`Unknown country code: ${code}`)
  }

  return country
}
