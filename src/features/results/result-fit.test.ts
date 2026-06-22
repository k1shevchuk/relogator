import { describe, expect, it } from "vitest"

import type { DifficultyLevel, RouteAssessment } from "@/domain/types"

import { getRouteFitBucket, groupResultsByFit } from "./result-fit"

function assessment(
  status: RouteAssessment["status"],
  level: DifficultyLevel,
  routeId = `${status}-${level}`
): RouteAssessment {
  return {
    status,
    difficulty: { level, label: String(level) },
    route: { id: routeId },
  } as RouteAssessment
}

describe("result fit grouping", () => {
  it("classifies routes into user-facing fit buckets", () => {
    expect(getRouteFitBucket(assessment("available", 1))).toBe("best")
    expect(getRouteFitBucket(assessment("available", 3))).toBe("medium")
    expect(getRouteFitBucket(assessment("conditional", 3))).toBe("medium")
    expect(getRouteFitBucket(assessment("conditional", 4))).toBe("weak")
    expect(getRouteFitBucket(assessment("unknown", 3))).toBe("weak")
    expect(getRouteFitBucket(assessment("blocked", 1))).toBe("blocked")
  })

  it("keeps grouped routes in their original order", () => {
    const grouped = groupResultsByFit([
      assessment("available", 2, "armenia"),
      assessment("available", 3, "vietnam"),
      assessment("conditional", 4, "serbia"),
      assessment("blocked", 1, "blocked-route"),
      assessment("available", 1, "kazakhstan"),
    ])

    expect(grouped.best.map((item) => item.route.id)).toEqual([
      "armenia",
      "kazakhstan",
    ])
    expect(grouped.medium.map((item) => item.route.id)).toEqual(["vietnam"])
    expect(grouped.weak.map((item) => item.route.id)).toEqual(["serbia"])
    expect(grouped.blocked.map((item) => item.route.id)).toEqual([
      "blocked-route",
    ])
  })
})
