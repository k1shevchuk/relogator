import { notFound, redirect } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import {
  getRouteFromCatalogue,
  localContentCatalogue,
} from "@/domain/content-catalogue"
import { getContentCatalogue } from "@/domain/content-repository"
import { RouteDetailClient } from "@/features/routes/route-detail-client"
import { getCurrentSupabaseUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return localContentCatalogue.routes.map((route) => ({ routeId: route.id }))
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>
}) {
  const { routeId } = await params
  const catalogue = await getContentCatalogue()
  const route = getRouteFromCatalogue(catalogue, routeId)

  if (!route) {
    notFound()
  }

  const user = await getCurrentSupabaseUser()

  if (!user) {
    redirect(
      `/auth/login?${new URLSearchParams({
        message: "Войдите, чтобы открыть пошаговый план и сохранить прогресс.",
        next: `/routes/${routeId}`,
      })}`
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <RouteDetailClient catalogue={catalogue} route={route} />
      </main>
    </>
  )
}
