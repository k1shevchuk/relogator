"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  ClipboardList,
  Filter,
  ListChecks,
  MapPinned,
  RotateCcw,
} from "lucide-react"

import { LegalNotice } from "@/components/legal-notice"
import { RouteCard } from "@/components/route-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { assessRoutes, simulateAnswerImpact } from "@/domain/assessment"
import type { ContentCatalogue } from "@/domain/content-catalogue"
import type { AnswerImpact, RouteAssessment, UserProfile } from "@/domain/types"
import { summarizeProfile } from "@/features/questionnaire/profile-labels"
import {
  profileStorageKey,
  userProfileSchema,
} from "@/features/questionnaire/profile-schema"
import {
  groupResultsByFit,
  resultFitSections,
  type ResultFitBucket,
} from "@/features/results/result-fit"
import { cn } from "@/lib/utils"

const filters = [
  { value: "all", label: "Все" },
  { value: "easy", label: "Проще всего" },
  { value: "fast", label: "Быстрее всего" },
  { value: "family", label: "Для семьи" },
  { value: "remote", label: "Удаленная работа" },
  { value: "business", label: "Бизнес" },
  { value: "documents", label: "Меньше документов" },
] as const

type FilterValue = (typeof filters)[number]["value"]

type ResultsClientProps = {
  catalogue: ContentCatalogue
}

export function ResultsClient({ catalogue }: ResultsClientProps) {
  const [filter, setFilter] = useState<FilterValue>("all")
  const rawProfile = useSyncExternalStore(
    subscribeProfileStorage,
    readProfileStorage,
    () => ""
  )
  const profile = useMemo(() => parseProfile(rawProfile), [rawProfile])

  const results = useMemo(
    () => (profile ? assessRoutes(profile, catalogue) : []),
    [catalogue, profile]
  )
  const filteredResults = useMemo(
    () => filterResults(results, filter),
    [filter, results]
  )
  const groupedResults = useMemo(
    () => groupResultsByFit(filteredResults),
    [filteredResults]
  )
  const answerImpacts = useMemo(
    () => (profile ? buildAnswerImpacts(profile, catalogue) : []),
    [catalogue, profile]
  )

  if (!profile) {
    return (
      <div className="flex flex-col gap-5">
        <Alert>
          <ClipboardList data-icon="inline-start" />
          <AlertTitle>Анкета еще не заполнена</AlertTitle>
          <AlertDescription>
            Пройдите короткую анкету, чтобы Relogator показал маршруты по вашей
            цели и ограничениям.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-fit">
          <Link href="/questionnaire">Начать подбор</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <LegalNotice />

      <section className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col justify-between gap-4 rounded-lg bg-foreground p-4 text-background">
          <div className="flex items-center justify-between gap-3">
            <MapPinned className="size-6 text-background/70" />
            <span className="rounded-md bg-background/10 px-2 py-1 text-xs text-background/75">
              расчет
            </span>
          </div>
          <div>
            <div className="text-5xl font-semibold leading-none">
              {results.length}
            </div>
            <p className="mt-2 text-sm leading-6 text-background/70">
              маршрутов проверяются по вашей анкете и ограничениям
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl font-semibold">
                Подходящие маршруты
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Страна не была первым фильтром. Сначала система смотрит цель,
                сроки, паспорт, доход, семью и готовность документов.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/questionnaire">
                <RotateCcw data-icon="inline-start" />
                Изменить анкету
              </Link>
            </Button>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {summarizeProfile(profile).map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 flex-col gap-1 rounded-md border bg-background px-3 py-2"
              >
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="min-w-0 truncate font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as FilterValue)}
          >
            <TabsList className="grid h-auto w-full grid-cols-2 items-stretch justify-stretch gap-1 bg-muted/70 p-1 sm:flex sm:flex-wrap sm:justify-start">
              {filters.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="min-h-9 flex-none whitespace-normal rounded-md px-2 py-1 text-center text-xs leading-5 sm:text-sm"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {answerImpacts.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border bg-accent/55 p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <ListChecks className="mt-0.5 size-4 text-primary" />
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-lg font-semibold">
                Что улучшит подбор
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Ниже показано, какие ответы меняют статус или сложность
                маршрутов по тем же правилам, что и основной расчет.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {answerImpacts.map((impact) => (
              <ImpactCard
                key={`${impact.field}-${String(impact.value)}`}
                impact={impact}
              />
            ))}
          </div>
        </section>
      )}

      {filteredResults.length > 0 ? (
        <div className="flex flex-col gap-6">
          {resultFitSections.map((section) => {
            const items = groupedResults[section.bucket]
            const tone = fitSectionStyles[section.bucket]

            if (items.length === 0) {
              return null
            }

            return (
              <section key={section.bucket} className="flex flex-col gap-4">
                <div
                  className={cn(
                    "flex flex-wrap items-end justify-between gap-3 border-l-4 px-4 py-3",
                    tone.header
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium",
                          tone.badge
                        )}
                      >
                        {section.badge}
                      </span>
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {items.length} из {filteredResults.length}
                      </span>
                    </div>
                    <h2 className="font-heading text-xl font-semibold leading-snug">
                      {section.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs font-medium",
                      tone.count
                    )}
                  >
                    {items.length}
                  </span>
                </div>
                {items.map((assessment) => (
                  <RouteCard
                    key={assessment.route.id}
                    assessment={assessment}
                    tone={section.bucket}
                  />
                ))}
              </section>
            )
          })}
        </div>
      ) : results.length === 0 ? (
        <Alert>
          <Filter data-icon="inline-start" />
          <AlertTitle>Нет подходящих маршрутов по анкете</AlertTitle>
          <AlertDescription>
            По текущим ответам правила не нашли маршрут с достаточным сроком
            паспорта, подходящей целью и документами. Начните с проверки
            паспорта, дохода и основания для долгого пребывания.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Filter data-icon="inline-start" />
          <AlertTitle>Нет маршрутов под выбранный фильтр</AlertTitle>
          <AlertDescription>
            Попробуйте другой фильтр или вернитесь в анкету и уточните
            ограничения.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

const fitSectionStyles: Record<
  ResultFitBucket,
  {
    header: string
    badge: string
    count: string
  }
> = {
  best: {
    header: "border-emerald-600 bg-emerald-50/80",
    badge: "bg-emerald-700 text-white",
    count: "border-emerald-200 bg-white text-emerald-950",
  },
  medium: {
    header: "border-amber-500 bg-amber-50/85",
    badge: "bg-amber-600 text-white",
    count: "border-amber-200 bg-white text-amber-950",
  },
  weak: {
    header: "border-rose-500 bg-rose-50/85",
    badge: "bg-rose-700 text-white",
    count: "border-rose-200 bg-white text-rose-950",
  },
  blocked: {
    header: "border-zinc-950 bg-zinc-100/85",
    badge: "bg-zinc-950 text-white",
    count: "border-zinc-300 bg-white text-zinc-950",
  },
}

function buildAnswerImpacts(
  profile: UserProfile,
  catalogue: ContentCatalogue
): AnswerImpact[] {
  const impacts: AnswerImpact[] = []

  if (!profile.hasCriminalRecordCertificate) {
    impacts.push(
      simulateAnswerImpact(
        profile,
        "hasCriminalRecordCertificate",
        true,
        catalogue
      ) as AnswerImpact
    )
  }

  if (profile.departureWindow !== "three_months") {
    impacts.push(
      simulateAnswerImpact(
        profile,
        "departureWindow",
        "three_months",
        catalogue
      ) as AnswerImpact
    )
  }

  if (!profile.hasProvableIncome) {
    impacts.push(
      simulateAnswerImpact(
        profile,
        "hasProvableIncome",
        true,
        catalogue
      ) as AnswerImpact
    )
  }

  if (profile.translationReadiness !== "ready_with_list") {
    impacts.push(
      simulateAnswerImpact(
        profile,
        "translationReadiness",
        "ready_with_list",
        catalogue
      ) as AnswerImpact
    )
  }

  return impacts.filter((impact) => impact.changedRoutes.length > 0).slice(0, 3)
}

function ImpactCard({ impact }: { impact: AnswerImpact }) {
  return (
    <article className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
      <p className="text-sm leading-6">{impact.summary}</p>
      <ul className="flex flex-col gap-1 text-xs leading-5 text-muted-foreground">
        {impact.changedRoutes.slice(0, 3).map((route) => (
          <li key={route.routeId}>
            {route.countryName}: {impactChangeLabels[route.change]},{" "}
            {impactStatusLabels[route.afterStatus]}
          </li>
        ))}
      </ul>
    </article>
  )
}

const impactStatusLabels: Record<RouteAssessment["status"], string> = {
  available: "маршрут подходит",
  conditional: "нужно выполнить условия",
  blocked: "пока не подходит",
  unknown: "нужна ручная проверка",
}

const impactChangeLabels: Record<
  AnswerImpact["changedRoutes"][number]["change"],
  string
> = {
  opened: "становится доступнее",
  easier: "становится проще",
  harder: "становится сложнее",
  blocked: "может закрыться",
  changed: "меняется оценка",
}

function subscribeProfileStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)

  return () => window.removeEventListener("storage", onStoreChange)
}

function readProfileStorage() {
  return window.localStorage.getItem(profileStorageKey) ?? ""
}

function parseProfile(raw: string): UserProfile | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = userProfileSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function filterResults(
  results: RouteAssessment[],
  filter: FilterValue
): RouteAssessment[] {
  if (filter === "easy") {
    return results.filter((item) => item.difficulty.level <= 2)
  }

  if (filter === "fast") {
    return results.filter((item) => item.route.timeline.preparationDays <= 14)
  }

  if (filter === "family") {
    return results.filter((item) => item.route.supports.family)
  }

  if (filter === "remote") {
    return results.filter((item) => item.route.supports.remoteWork)
  }

  if (filter === "business") {
    return results.filter((item) => item.route.supports.business)
  }

  if (filter === "documents") {
    return results.filter((item) => item.documents.length <= 4)
  }

  return results
}
