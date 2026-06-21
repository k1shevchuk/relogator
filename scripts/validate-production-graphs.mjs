import path from "node:path"
import { fileURLToPath } from "node:url"

import { loadProductionGraphDrafts } from "../src/domain/production-graph-schemas.mts"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const graphDir = path.join(rootDir, "data", "drafts", "production-graphs")
const loaded = loadProductionGraphDrafts(graphDir)

if (loaded.results.length === 0) {
  console.log("Production graph validation: no draft JSON files found.")
  process.exit(0)
}

let issueCount = 0

console.log(
  `Production graph validation: checking ${loaded.results.length} draft file(s).`
)

for (const result of loaded.results) {
  const relativeFile = path.relative(rootDir, result.file)

  if (result.ok) {
    const countryCount = result.draft?.countries.length ?? 0
    const routeCount =
      result.draft?.countries.reduce(
        (total, country) => total + country.routeNodes.length,
        0
      ) ?? 0

    console.log(
      `OK  ${relativeFile}: ${countryCount} countries, ${routeCount} routes`
    )
    continue
  }

  console.error(`ERR ${relativeFile}`)

  for (const issue of result.issues) {
    issueCount += 1
    console.error(`  - ${issue.path}: ${issue.message}`)
  }
}

if (issueCount > 0) {
  console.error(
    `Production graph validation failed with ${issueCount} issue(s).`
  )
  process.exit(1)
}

console.log("Production graph validation passed.")
