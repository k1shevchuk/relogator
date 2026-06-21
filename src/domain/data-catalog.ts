import { rawDataCatalog } from "./data-files"
import { validateDataCatalog } from "./data-schemas"
import type {
  Country,
  DataRouteDefinition,
  DocumentDefinition,
  RequirementDefinition,
  RouteDefinition,
  RouteSource,
} from "./types"

export const dataCatalog = validateDataCatalog(rawDataCatalog)
export const dataManifest = dataCatalog.manifest

const requirementById = new Map(
  dataCatalog.requirements.map((requirement) => [
    requirement.id,
    requirement as RequirementDefinition,
  ])
)
const documentById = new Map(
  dataCatalog.documents.map((document) => [
    document.id,
    document as DocumentDefinition,
  ])
)

export const countries = dataCatalog.countries as Country[]
export const sources = dataCatalog.sources as RouteSource[]
export const requirements = dataCatalog.requirements as RequirementDefinition[]
export const documents = dataCatalog.documents as DocumentDefinition[]
export const routes = dataCatalog.routes.map(hydrateRoute)

function hydrateRoute(dataRoute: DataRouteDefinition): RouteDefinition {
  const { documentIds, requirementIds, ...route } = dataRoute
  const documents = documentIds.map((documentId) => {
    const document = documentById.get(documentId)

    if (!document) {
      throw new Error(`Unknown document ${documentId} in route ${dataRoute.id}`)
    }

    return document.title
  })
  const requirements = requirementIds.reduce<RouteDefinition["requirements"]>(
    (result, requirementId) => {
      const requirement = requirementById.get(requirementId)

      if (!requirement) {
        throw new Error(
          `Unknown requirement ${requirementId} in route ${dataRoute.id}`
        )
      }

      return {
        ...result,
        ...requirement.config,
      }
    },
    { minPassportMonths: 0 }
  )

  if (!requirements.minPassportMonths) {
    throw new Error(`Route ${dataRoute.id} has no passport requirement`)
  }

  return {
    ...route,
    requirements,
    documents,
  }
}
