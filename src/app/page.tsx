import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
} from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { dataManifest } from "@/domain/data-catalog"
import { getContentCatalogue } from "@/domain/content-repository"

export const revalidate = 300

export default async function Home() {
  const catalogue = await getContentCatalogue()
  const popularRoutes = [
    "georgia-visa-free-one-year",
    "serbia-temporary-residence-business-work",
    "armenia-visa-free-180",
  ]
    .map((routeId) => catalogue.routes.find((route) => route.id === routeId))
    .filter((route): route is (typeof catalogue.routes)[number] =>
      Boolean(route)
    )
  const countryCount = catalogue.countries.length
  const routeCount = catalogue.routes.length
  const sourceCount = catalogue.sources.length

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:py-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col justify-between gap-6 rounded-lg border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex w-fit items-center gap-2 rounded-md border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                <Gauge className="size-4" />
                Подбор по анкете, а не по списку стран
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="max-w-4xl font-heading text-4xl font-semibold leading-[1.06] sm:text-5xl">
                  Спокойный план переезда по вашим вводным
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Relogator сопоставляет цель, сроки, документы, бюджет и
                  семейные вводные с маршрутами из базы. На выходе — страны,
                  сложность, риски, источники и понятный следующий шаг.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <SignalItem text="Сначала анкета" />
                <SignalItem text="Потом страны" />
                <SignalItem text="План после входа" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                В базе сейчас {countryCount} стран, {routeCount} маршрут и{" "}
                {sourceCount} источник. Цель по наполнению:{" "}
                {dataManifest.targetCountryCount} стран.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/questionnaire">
                  Начать подбор
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/results">Открыть результаты</Link>
              </Button>
            </div>
          </div>

          <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-col gap-1">
              <h2 className="font-heading text-lg font-semibold">
                Популярные направления
              </h2>
              <p className="text-sm text-muted-foreground">
                Можно открыть план после входа.
              </p>
            </div>
            <div className="grid gap-2">
              {popularRoutes.map((route) => (
                <Link
                  key={route.id}
                  href={`/routes/${route.id}`}
                  className="group flex gap-3 rounded-md border bg-background p-3 outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {
                        catalogue.countries.find(
                          (country) => country.code === route.countryCode
                        )?.name
                      }
                    </span>
                    <span className="block text-sm leading-5 text-muted-foreground">
                      {route.title}
                    </span>
                  </span>
                  <ArrowRight className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  )
}

function SignalItem({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <CheckCircle2 className="size-4 text-primary" />
      {text}
    </span>
  )
}
