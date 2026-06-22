import "server-only"

import { cache } from "react"

import {
  buildContentCatalogueFromRows,
  localContentCatalogue,
  type ContentCatalogue,
} from "./content-catalogue"
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server"

export const getContentCatalogue = cache(
  async (): Promise<ContentCatalogue> => {
    if (!isSupabaseConfigured()) {
      return localContentCatalogue
    }

    try {
      const supabase = await createSupabaseServerClient()
      const [countriesResult, sourcesResult, routesResult] = await Promise.all([
        supabase.from("content_countries").select("*").order("code"),
        supabase.from("content_sources").select("*").order("id"),
        supabase
          .from("content_routes")
          .select("*")
          .order("country_code")
          .order("id"),
      ])

      if (
        countriesResult.error ||
        sourcesResult.error ||
        routesResult.error ||
        !countriesResult.data?.length ||
        !sourcesResult.data?.length ||
        !routesResult.data?.length
      ) {
        return localContentCatalogue
      }

      return buildContentCatalogueFromRows({
        countries: countriesResult.data,
        sources: sourcesResult.data,
        routes: routesResult.data,
      })
    } catch {
      return localContentCatalogue
    }
  }
)
