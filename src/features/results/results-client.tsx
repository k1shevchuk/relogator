"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ClipboardList, Filter, ListChecks, RotateCcw } from "lucide-react"

import { LegalNotice } from "@/components/legal-notice"
import { RouteCard } from "@/components/route-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { assessRoutes, simulateAnswerImpact } from "@/domain/assessment"
import type {
  AnswerImpact,
  RouteAssessment,
  RouteAvailabilityStatus,
  UserProfile,
} from "@/domain/types"
import { summarizeProfile } from "@/features/questionnaire/profile-labels"
import {
  profileStorageKey,
  userProfileSchema,
} from "@/features/questionnaire/profile-schema"

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

export function ResultsClient() {
  const [filter, setFilter] = useState<FilterValue>("all")
  const rawProfile = useSyncExternalStore(
    subscribeProfileStorage,
    readProfileStorage,
    () => ""
  )
  const profile = useMemo(() => parseProfile(rawProfile), [rawProfile])

  const results = useMemo(
    () => (profile ? assessRoutes(profile) : []),
    [profile]
  )
  const filteredResults = useMemo(
    () => filterResults(results, filter),
    [filter, results]
  )
  const groupedResults = useMemo(
    () => groupResults(filteredResults),
    [filteredResults]
  )
  const answerImpacts = useMemo(
    () => (profile ? buildAnswerImpacts(profile) : []),
    [profile]
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

      <section className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-xl font-semibold">
              Подходящие маршруты
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Подбор основан на ответах анкеты, структурированных правилах и
              официальных источниках. Страна не была первым фильтром.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/questionnaire">
              <RotateCcw data-icon="inline-start" />
              Изменить анкету
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-2 rounded-md border bg-background p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Ваши вводные</h3>
            <span className="text-xs text-muted-foreground">
              {results.length} маршрутов в расчете
            </span>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {summarizeProfile(profile).map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-center gap-1 rounded-md bg-muted px-2 py-1"
              >
                <dt className="shrink-0 text-muted-foreground">
                  {item.label}:
                </dt>
                <dd className="min-w-0 truncate">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as FilterValue)}
          >
            <TabsList className="flex h-auto w-full flex-wrap justify-start">
              {filters.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {answerImpacts.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <ListChecks className="mt-0.5 size-4 text-primary" />
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-lg font-semibold">
                Что может открыть больше вариантов
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Ниже показано, какие ответы меняют статус или сложность
                маршрутов. Это справочная симуляция по тем же правилам, что и
                основной расчет.
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
          {resultSections.map((section) => {
            const items = groupedResults[section.status]

            if (items.length === 0) {
              return null
            }

            return (
              <section key={section.status} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-xl font-semibold">
                      {section.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                {items.map((assessment) => (
                  <RouteCard
                    key={assessment.route.id}
                    assessment={assessment}
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

const resultSections: {
  status: RouteAvailabilityStatus
  title: string
  description: string
}[] = [
  {
    status: "available",
    title: "Можно начинать сейчас",
    description: "Нет явных блокирующих условий по текущим ответам.",
  },
  {
    status: "conditional",
    title: "Можно после подготовки",
    description:
      "Маршрут остается реалистичным, если закрыть указанные документы, доход или сроки.",
  },
  {
    status: "unknown",
    title: "Сложно, но возможно",
    description:
      "Данные требуют перепроверки или маршрут чувствителен к решению компетентного органа.",
  },
  {
    status: "blocked",
    title: "Не подходит по текущим ответам",
    description:
      "Показано для прозрачности: карточка объясняет, что именно мешает.",
  },
]

function groupResults(results: RouteAssessment[]) {
  return resultSections.reduce(
    (groups, section) => ({
      ...groups,
      [section.status]: results.filter(
        (item) => item.status === section.status
      ),
    }),
    {
      available: [],
      conditional: [],
      unknown: [],
      blocked: [],
    } as Record<RouteAvailabilityStatus, RouteAssessment[]>
  )
}

function buildAnswerImpacts(profile: UserProfile): AnswerImpact[] {
  const impacts: AnswerImpact[] = []

  if (!profile.hasCriminalRecordCertificate) {
    impacts.push(
      simulateAnswerImpact(
        profile,
        "hasCriminalRecordCertificate",
        true
      ) as AnswerImpact
    )
  }

  if (profile.departureWindow !== "three_months") {
    impacts.push(
      simulateAnswerImpact(
        profile,
        "departureWindow",
        "three_months"
      ) as AnswerImpact
    )
  }

  if (!profile.hasProvableIncome) {
    impacts.push(
      simulateAnswerImpact(profile, "hasProvableIncome", true) as AnswerImpact
    )
  }

  if (profile.translationReadiness !== "ready_with_list") {
    impacts.push(
      simulateAnswerImpact(
        profile,
        "translationReadiness",
        "ready_with_list"
      ) as AnswerImpact
    )
  }

  return impacts.filter((impact) => impact.changedRoutes.length > 0).slice(0, 3)
}

function ImpactCard({ impact }: { impact: AnswerImpact }) {
  return (
    <article className="flex flex-col gap-2 rounded-md border bg-background p-3">
      <p className="text-sm leading-6">{impact.summary}</p>
      <ul className="flex flex-col gap-1 text-xs leading-5 text-muted-foreground">
        {impact.changedRoutes.slice(0, 3).map((route) => (
          <li key={route.routeId}>
            {route.countryName}: {route.afterStatus}
          </li>
        ))}
      </ul>
    </article>
  )
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
