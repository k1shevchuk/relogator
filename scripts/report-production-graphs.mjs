import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { loadProductionGraphDrafts } from "../src/domain/production-graph-schemas.mts"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const graphDir = path.join(rootDir, "data", "drafts", "production-graphs")
const catalog = readJson(path.join(rootDir, "data", "catalog.json"))
const loaded = loadProductionGraphDrafts(graphDir)
const invalidResults = loaded.results.filter((result) => !result.ok)

if (invalidResults.length > 0) {
  console.error("Production graph report cannot run while drafts are invalid.")

  for (const result of invalidResults) {
    console.error(`ERR ${path.relative(rootDir, result.file)}`)

    for (const issue of result.issues) {
      console.error(`  - ${issue.path}: ${issue.message}`)
    }
  }

  process.exit(1)
}

const publicCountryCodes = readPublicCountryCodes()
const targetCountryCodes = [
  ...catalog.currentCountryCodes,
  ...catalog.plannedCountryCodes,
]
const graphCountryCodes = new Set()
const routeStatuses = new Map()
let officialSourceCount = 0
let sourceNeededCount = 0
let manualReviewQuestionCount = 0

for (const draft of loaded.drafts) {
  for (const country of draft.countries) {
    graphCountryCodes.add(country.countryCode)
    manualReviewQuestionCount += country.manualReviewQuestions.length

    for (const source of country.sourceNodes) {
      if (source.officialness === "official") {
        officialSourceCount += 1
      }

      if (
        source.officialness === "source_needed" ||
        source.sourceType === "source_needed" ||
        source.url === "source_needed"
      ) {
        sourceNeededCount += 1
      }
    }

    for (const route of country.routeNodes) {
      routeStatuses.set(
        route.publicationStatusSuggestion,
        (routeStatuses.get(route.publicationStatusSuggestion) ?? 0) + 1
      )
      manualReviewQuestionCount += route.manualReviewQuestions.length

      for (const step of route.steps) {
        manualReviewQuestionCount += step.manualReviewQuestions.length
      }
    }
  }
}

const coveredByPublicOrGraph = new Set([
  ...publicCountryCodes,
  ...Array.from(graphCountryCodes),
])
const missingCountryCodes = targetCountryCodes.filter(
  (countryCode) => !coveredByPublicOrGraph.has(countryCode)
)

console.log("Production graph report")
console.log(`Draft files: ${loaded.results.length}`)
console.log(`Graph countries covered: ${graphCountryCodes.size}`)
console.log(
  `Public or graph coverage: ${coveredByPublicOrGraph.size}/${targetCountryCodes.length}`
)
console.log(
  `Sources: official=${officialSourceCount}; source_needed=${sourceNeededCount}`
)
console.log(`Routes by status: ${formatRouteStatuses(routeStatuses)}`)
console.log(`Manual review questions: ${manualReviewQuestionCount}`)
console.log(
  `Missing countries: ${missingCountryCodes.length ? missingCountryCodes.join(", ") : "none"}`
)

function readPublicCountryCodes() {
  const countriesDir = path.join(rootDir, "data", "countries")

  if (!existsSync(countriesDir)) {
    return []
  }

  return readdirSync(countriesDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => readJson(path.join(countriesDir, file)).code)
    .sort((first, second) => first.localeCompare(second))
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"))
}

function formatRouteStatuses(routeStatuses) {
  if (routeStatuses.size === 0) {
    return "none"
  }

  return Array.from(routeStatuses.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([status, count]) => `${status}=${count}`)
    .join("; ")
}
