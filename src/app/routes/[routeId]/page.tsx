import { notFound } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import { getRoute, routes } from "@/domain/routes"
import { RouteDetailClient } from "@/features/routes/route-detail-client"

export function generateStaticParams() {
  return routes.map((route) => ({ routeId: route.id }))
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>
}) {
  const { routeId } = await params

  if (!getRoute(routeId)) {
    notFound()
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <RouteDetailClient routeId={routeId} />
      </main>
    </>
  )
}
