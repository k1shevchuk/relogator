import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  Globe2,
  LockKeyhole,
  Map,
  ShieldCheck,
} from "lucide-react"

import { LegalNotice } from "@/components/legal-notice"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
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
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10">
        <section className="grid min-h-[560px] gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="flex flex-col justify-between gap-6 rounded-lg border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex w-fit items-center gap-2 rounded-md border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                <Gauge className="size-4" />
                Подбор по анкете, а не по списку стран
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="max-w-4xl font-heading text-4xl font-semibold leading-[1.04] sm:text-5xl lg:text-6xl">
                  Спокойный план переезда вместо десятков вкладок и слухов
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Relogator сопоставляет цель, сроки, документы, бюджет и
                  семейные вводные с маршрутами из базы. На выходе — страны,
                  сложность, риски, источники и понятный следующий шаг.
                </p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <SignalItem text="Сначала анкета" />
                <SignalItem text="Потом страны" />
                <SignalItem text="План после входа" />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/questionnaire">
                  Начать подбор
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/results">Вернуться к результатам анкеты</Link>
              </Button>
            </div>
            <LegalNotice />
          </div>

          <div className="grid gap-4">
            <section className="rounded-lg border bg-foreground p-5 text-background shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-background/65">Каталог MVP</p>
                  <h2 className="font-heading text-2xl font-semibold">
                    {countryCount} стран, {routeCount} маршрут, {sourceCount}{" "}
                    источник
                  </h2>
                </div>
                <Database className="size-6 text-background/70" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Metric label="Стран" value={countryCount} />
                <Metric label="Маршрутов" value={routeCount} />
                <Metric label="Цель" value={dataManifest.targetCountryCount} />
              </div>
              <p className="mt-5 text-sm leading-6 text-background/70">
                Рабочие данные читаются из Supabase. Локальные файлы остаются
                резервом и сидом для обновления базы.
              </p>
            </section>

            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold">
                  Популярные направления
                </h2>
                <Badge variant="secondary">тестовый топ</Badge>
              </div>
              <div className="grid gap-2">
                {popularRoutes.map((route, index) => (
                  <Link
                    key={route.id}
                    href={`/routes/${route.id}`}
                    className="group grid gap-3 rounded-md border bg-background p-3 outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[auto_1fr_auto]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {
                          catalogue.countries.find(
                            (country) => country.code === route.countryCode
                          )?.name
                        }
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {route.title}
                      </span>
                    </span>
                    <ArrowRight className="hidden size-5 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <ProcessItem
            icon={<ClipboardCheck />}
            title="Анкета"
            text="Сначала цель и ограничения пользователя, страна не является первым фильтром."
          />
          <ProcessItem
            icon={<Map />}
            title="Маршруты"
            text="Система сравнивает связку пользователь, цель, страна и маршрут."
          />
          <ProcessItem
            icon={<ShieldCheck />}
            title="Источники"
            text="Каждый маршрут имеет дату проверки и ссылки на официальные источники."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl font-semibold">
              Все начинается с вводных
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Сервис не просит сразу выбрать страну. Он сначала собирает
              ограничения, затем объясняет, какие маршруты стали проще или
              сложнее.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Capability icon={<Globe2 />} title="Страны после анкеты" />
            <Capability icon={<FileText />} title="Документы по шагам" />
            <Capability icon={<ShieldCheck />} title="Риски и источники" />
            <Capability icon={<LockKeyhole />} title="План после входа" />
          </div>
        </section>
      </main>
    </>
  )
}

function SignalItem({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
      <CheckCircle2 className="size-4 text-primary" />
      {text}
    </span>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background/10 p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-background/65">{label}</div>
    </div>
  )
}

function Capability({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex min-h-28 flex-col justify-between rounded-lg border bg-card p-4 shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="text-sm font-medium leading-5">{title}</h3>
    </div>
  )
}

function ProcessItem({
  icon,
  text,
  title,
}: {
  icon: ReactNode
  text: string
  title: string
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary [&_svg]:size-5">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-medium">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
