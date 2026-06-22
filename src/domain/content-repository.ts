import "server-only"

import { cache } from "react"

import {
  buildContentCatalogueFromRows,
  localContentCatalogue,
  type ContentCatalogue,
  type ContentRouteRow,
} from "./content-catalogue"
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server"

const CATALOGUE_DB_TIMEOUT_MS = 6000
const ROUTE_ROWS_BATCH_SIZE = 4

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>

export const getContentCatalogue = cache(
  async (): Promise<ContentCatalogue> => {
    if (!isSupabaseConfigured()) {
      return localContentCatalogue
    }

    try {
      const supabase = await createSupabaseServerClient()
      const [countriesResult, sourcesResult, routeIdsResult] =
        await Promise.all([
          supabase
            .from("content_countries")
            .select("*")
            .order("code")
            .abortSignal(createCatalogueAbortSignal()),
          supabase
            .from("content_sources")
            .select("*")
            .order("id")
            .abortSignal(createCatalogueAbortSignal()),
          supabase
            .from("content_routes")
            .select("id,country_code")
            .order("country_code")
            .order("id")
            .abortSignal(createCatalogueAbortSignal()),
        ])

      if (
        countriesResult.error ||
        sourcesResult.error ||
        routeIdsResult.error ||
        !countriesResult.data?.length ||
        !sourcesResult.data?.length ||
        !routeIdsResult.data?.length
      ) {
        return localContentCatalogue
      }

      const routes = await fetchContentRoutesById(
        supabase,
        routeIdsResult.data.map((route) => route.id)
      )

      if (!routes.length) {
        return localContentCatalogue
      }

      return buildContentCatalogueFromRows({
        countries: countriesResult.data,
        sources: sourcesResult.data,
        routes,
      })
    } catch {
      return localContentCatalogue
    }
  }
)

async function fetchContentRoutesById(
  supabase: SupabaseServerClient,
  routeIds: string[]
): Promise<ContentRouteRow[]> {
  const routeResults = await Promise.all(
    chunk(routeIds, ROUTE_ROWS_BATCH_SIZE).map((routeIdBatch) =>
      supabase
        .from("content_routes")
        .select("*")
        .in("id", routeIdBatch)
        .abortSignal(createCatalogueAbortSignal())
    )
  )

  if (routeResults.some((result) => result.error || !result.data?.length)) {
    return []
  }

  const routesById = new Map(
    routeResults
      .flatMap((result) => result.data ?? [])
      .map((route) => [route.id, route])
  )

  return routeIds.flatMap((routeId) => {
    const route = routesById.get(routeId)

    return route ? [route] : []
  })
}

function createCatalogueAbortSignal() {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(CATALOGUE_DB_TIMEOUT_MS)
  }

  const controller = new AbortController()

  setTimeout(() => controller.abort(), CATALOGUE_DB_TIMEOUT_MS)

  return controller.signal
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}
