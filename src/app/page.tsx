import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  Map,
  ShieldCheck,
} from "lucide-react"

import { LegalNotice } from "@/components/legal-notice"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { countries } from "@/domain/countries"
import { dataManifest } from "@/domain/data-catalog"
import { routes } from "@/domain/routes"

export default function Home() {
  const popularRoutes = [
    "georgia-visa-free-one-year",
    "serbia-temporary-residence-business-work",
    "armenia-visa-free-180",
  ]
    .map((routeId) => routes.find((route) => route.id === routeId))
    .filter((route): route is (typeof routes)[number] => Boolean(route))
  const countryCount = countries.length
  const routeCount = routes.length

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col justify-center gap-5">
            <div className="flex flex-col gap-3">
              <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight">
                Relogator подбирает маршруты переезда по анкете, а не по
                догадкам
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Ответьте на вопросы о цели, сроках, документах, доходе и семье.
                Сервис покажет страны, маршруты, сложность, риски и официальные
                источники.
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
                <Link href="/results">Вернуться к результатам анкеты</Link>
              </Button>
            </div>
            <LegalNotice />
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>
                База MVP: {countryCount} стран и {routeCount} маршрут
              </CardTitle>
              <CardDescription>
                Данные хранятся как структурированные файлы с источниками, датой
                проверки и статусом глубины. Следующая рамка расширения -{" "}
                {dataManifest.targetCountryCount} страны.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {countries.map((country) => (
                <Badge key={country.code} variant="outline">
                  {country.name}
                </Badge>
              ))}
            </CardContent>
          </Card>
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

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl font-semibold">
              Топ-3 популярных направления
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Стартовый список MVP для быстрых сценариев из РФ. После
              накопления анкет этот блок нужно заменить реальной статистикой
              выбора пользователей. Пошаговый план открывается после входа.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {popularRoutes.map((route) => (
              <Link
                key={route.id}
                href={`/routes/${route.id}`}
                className="group rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full rounded-lg transition-colors group-hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>
                      {
                        countries.find(
                          (country) => country.code === route.countryCode
                        )?.name
                      }
                    </CardTitle>
                    <CardDescription>{route.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
                    <p>{route.shortDescription}</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <FileText />
                      <span>{route.documents.length} ключевых документа</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <LockKeyhole />
                      <span>План доступен после входа</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
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
    <div className="flex gap-3 rounded-lg border bg-card p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-medium">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
