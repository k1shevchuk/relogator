import { sources } from "./data-catalog"
import type { RouteSource } from "./types"

export const DATA_REVIEW_DATE = "2026-06-18"

export { sources }

export function getSources(sourceIds: string[]): RouteSource[] {
  return sourceIds
    .map((sourceId) => sources.find((source) => source.id === sourceId))
    .filter((source): source is RouteSource => Boolean(source))
}
