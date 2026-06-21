import { routes } from "./data-catalog"
import type { RouteDefinition } from "./types"

export { routes }

export function getRoute(routeId: string): RouteDefinition | undefined {
  return routes.find((route) => route.id === routeId)
}
