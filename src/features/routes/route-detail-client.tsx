"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { LegalNotice } from "@/components/legal-notice"
import { SpecialistRequestForm } from "@/components/specialist-request-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { assessRoutes } from "@/domain/assessment"
import { countryStatusLabels, getCountry } from "@/domain/countries"
import { getRoute } from "@/domain/routes"
import { getSources } from "@/domain/sources"
import type { AssessmentScaleKey, RouteAssessment } from "@/domain/types"
import { summarizeProfile } from "@/features/questionnaire/profile-labels"
import {
  parseStoredProfile,
  readStoredProfileSnapshot,
  subscribeStoredProfile,
} from "@/features/questionnaire/profile-storage"

type RouteDetailClientProps = {
  routeId: string
}

export function RouteDetailClient({ routeId }: RouteDetailClientProps) {
  const route = getRoute(routeId)
  const rawProfile = useSyncExternalStore(
    subscribeStoredProfile,
    readStoredProfileSnapshot,
    () => ""
  )
  const profile = useMemo(() => parseStoredProfile(rawProfile), [rawProfile])
  const assessment = useMemo<RouteAssessment | null>(() => {
    if (!profile || !route) {
      return null
    }

    return assessRoutes(profile, [route])[0] ?? null
  }, [profile, route])

  if (!route) {
    return null
  }

  const country = getCountry(route.countryCode)
  const sources = getSources(route.sourceIds)
  const documents = assessment?.documents ?? route.documents
  const blockers = assessment?.blockers ?? route.risks
  const whyFits = assessment?.whyFits ?? [
    "Это справочный маршрут из базы Relogator. Пройдите анкету, чтобы увидеть персональную оценку.",
  ]
  const firstActions = route.steps.slice(0, 3).map((step) => step.title)

  return (
    <>
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/results">
          <ArrowLeft data-icon="inline-start" />
          Назад к результатам
        </Link>
      </Button>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{country.name}</Badge>
              <Badge variant="outline">
                {countryStatusLabels[country.status]}
              </Badge>
              <Badge variant="outline">Проверено: {route.lastReviewedAt}</Badge>
              <Badge variant={assessment ? "secondary" : "outline"}>
                {assessment ? assessment.difficulty.label : "справочник"}
              </Badge>
              {assessment && (
                <Badge variant="outline">{assessment.statusLabel}</Badge>
              )}
            </div>
            <h1 className="font-heading text-3xl font-semibold leading-tight">
              {route.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {route.shortDescription}
            </p>
          </div>

          <LegalNotice />

          {!profile && (
            <Card className="rounded-lg border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle>Справочный режим</CardTitle>
                <CardDescription className="text-amber-950">
                  Сейчас показан общий маршрут без персональной оценки. Пройдите
                  анкету, чтобы увидеть сложность, документы и риски по вашим
                  вводным.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/questionnaire">Пройти анкету</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {profile && !assessment && (
            <Card className="rounded-lg border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle>Маршрут не совпал с текущей анкетой</CardTitle>
                <CardDescription className="text-amber-950">
                  Он остается доступен как справочный материал, но правила
                  подбора не считают его подходящим для текущей цели, срока или
                  документов.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/questionnaire">Изменить анкету</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>
                <h2>Персональная оценка</h2>
              </CardTitle>
              <CardDescription>
                Что в этом маршруте связано с вашей анкетой и что стоит
                проверить первым.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {assessment && (
                <div className="grid gap-2 md:grid-cols-5">
                  {scaleOrder.map((key) => (
                    <div
                      key={key}
                      className="flex flex-col gap-1 rounded-md border bg-background p-3"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {scaleLabels[key]}
                      </span>
                      <span className="text-sm font-medium">
                        {assessment.scales[key].level}/5
                      </span>
                      <span className="text-xs leading-5 text-muted-foreground">
                        {assessment.scales[key].label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-5 md:grid-cols-4">
                <DetailList
                  title="Почему подходит"
                  items={whyFits.slice(0, 4)}
                />
                <DetailList
                  title="Что может помешать"
                  items={blockers.slice(0, 4)}
                />
                <DetailList
                  title="Что может открыть"
                  items={
                    assessment?.unlocks.length
                      ? assessment.unlocks.slice(0, 4)
                      : ["Сверить источник и уточнить вводные перед действием."]
                  }
                />
                <DetailList title="Первые действия" items={firstActions} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>
                <h2>Пошаговый план</h2>
              </CardTitle>
              <CardDescription>
                Практический порядок действий от проверки решения до окончания
                разрешенного срока.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {route.steps.map((step, index) => (
                <article key={step.title} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
                      {index + 1}
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                      <h2 className="font-heading text-lg font-medium">
                        {step.title}
                      </h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 pl-10 md:grid-cols-3">
                    <DetailList title="Документы" items={step.documents} />
                    <DetailList
                      title="Частые ошибки"
                      items={step.commonMistakes}
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">
                        Когда нужен специалист
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {step.specialistHelp}
                      </p>
                    </div>
                  </div>
                  {index < route.steps.length - 1 && <Separator />}
                </article>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          {profile && (
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Ваши вводные</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-2 text-sm">
                  {summarizeProfile(profile).map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[105px_1fr] gap-2"
                    >
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Документы по маршруту</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
                {documents.map((document) => (
                  <li key={document}>{document}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Источники</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 rounded-md border p-3 text-sm hover:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{source.title}</span>
                    <span className="block text-muted-foreground">
                      {source.description}. Проверено: {source.lastReviewedAt}
                    </span>
                  </span>
                  <ExternalLink className="mt-0.5 size-4 shrink-0" />
                </a>
              ))}
            </CardContent>
          </Card>

          <SpecialistRequestForm
            countryName={country.name}
            routeId={route.id}
            routeTitle={route.title}
          />
        </aside>
      </section>
    </>
  )
}

const scaleOrder: AssessmentScaleKey[] = [
  "documents",
  "cost",
  "speed",
  "approvalRisk",
  "adaptation",
]

const scaleLabels: Record<AssessmentScaleKey, string> = {
  documents: "Документы",
  cost: "Расходы",
  speed: "Срок",
  approvalRisk: "Риск отказа или дополнительного запроса",
  adaptation: "Адаптация",
}

function DetailList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="flex flex-col gap-1 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
