"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Link2,
  WalletCards,
} from "lucide-react"

import { SpecialistRequestForm } from "@/components/specialist-request-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { buildRouteMetricSummaries } from "@/domain/assessment-display"
import { countryStatusLabels, getReviewFreshness } from "@/domain/countries"
import type { RouteAssessment } from "@/domain/types"
import { cn } from "@/lib/utils"

export type RouteCardTone = "best" | "medium" | "weak" | "blocked"

type RouteCardProps = {
  assessment: RouteAssessment
  tone?: RouteCardTone
}

export function RouteCard({ assessment, tone = "best" }: RouteCardProps) {
  const metricSummaries = buildRouteMetricSummaries(assessment)
  const toneStyle = routeCardToneStyles[tone]
  const difficultyStyle = getDifficultyBadgeStyle(assessment.difficulty.level)
  const reviewFreshness = getReviewFreshness(assessment.lastReviewedAt)

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg border bg-card py-0 shadow-sm",
        toneStyle.card
      )}
    >
      <CardHeader
        className={cn(
          "rounded-t-lg border-l-4 bg-secondary/35 py-4 sm:py-5",
          toneStyle.header
        )}
      >
        <div className="flex flex-col gap-1">
          <CardTitle className="text-2xl">{assessment.country.name}</CardTitle>
          <CardDescription className="text-sm">
            {assessment.route.title}
          </CardDescription>
        </div>
        <CardAction>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="outline">
              {countryStatusLabels[assessment.country.status]}
            </Badge>
            <Badge variant={getStatusVariant(assessment.status)}>
              {assessment.statusLabel}
            </Badge>
            <Badge
              variant={
                assessment.difficulty.level <= 2 ? "secondary" : "outline"
              }
              className={difficultyStyle.subtleBadge}
            >
              {assessment.difficulty.label}
            </Badge>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="flex min-w-0 flex-col gap-4 xl:col-start-1 xl:row-start-1">
            <p className="text-sm leading-6 text-muted-foreground">
              {assessment.route.shortDescription}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoLine
                icon={<CalendarDays />}
                label="Срок подготовки"
                value={assessment.timeline}
              />
              <InfoLine
                icon={<WalletCards />}
                label="Расходы на старт"
                value={assessment.cost}
              />
              <InfoLine
                icon={<FileText />}
                label="Документы"
                value={`${assessment.documents.length} ключевых пунктов`}
              />
            </div>
          </div>
          <aside className="rounded-lg border bg-background p-3 xl:sticky xl:top-20 xl:col-start-2 xl:row-span-3 xl:row-start-1">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Краткая оценка</span>
              <span
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium",
                  difficultyStyle.scoreBadge
                )}
              >
                сложность {assessment.difficulty.level}/5
              </span>
            </div>
            <div className="grid gap-2">
              {metricSummaries.map((metric) => (
                <MetricLine key={metric.label} metric={metric} />
              ))}
            </div>
          </aside>
          <div className="grid gap-4 md:grid-cols-2 xl:col-start-1 xl:row-start-2 xl:grid-cols-4">
            <RouteList
              title="Почему подходит"
              items={assessment.whyFits.slice(0, 3)}
            />
            <RouteList
              title="Подготовить первым"
              items={assessment.documents.slice(0, 3)}
            />
            <RouteList
              title="Что может помешать"
              items={assessment.blockers.slice(0, 3)}
            />
            <RouteList
              title="Что улучшит подбор"
              items={(assessment.unlocks.length
                ? assessment.unlocks
                : ["Подтвердить вводные и сверить источник перед действием."]
              ).slice(0, 3)}
            />
          </div>
          <div className="flex flex-col gap-4 xl:col-start-1 xl:row-start-3">
            <Separator />
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <span>
                Проверено: {assessment.lastReviewedAt}. Статус страны:{" "}
                {countryStatusLabels[assessment.country.status]}.
              </span>
              {reviewFreshness && (
                <span
                  className={cn(
                    "rounded-md border px-2 py-1",
                    reviewFreshness.tone === "risk"
                      ? "border-rose-200 bg-rose-50 text-rose-950"
                      : "border-amber-200 bg-amber-50 text-amber-950"
                  )}
                >
                  {reviewFreshness.label}
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                {assessment.sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-muted"
                  >
                    <Link2 />
                    {source.description}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 bg-muted/35 sm:flex-row sm:items-start sm:justify-between">
        <Button asChild>
          <Link href={`/routes/${assessment.route.id}`}>
            Открыть пошаговый план
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        <div className="sm:max-w-sm">
          <SpecialistRequestForm
            countryName={assessment.country.name}
            routeId={assessment.route.id}
            routeTitle={assessment.route.title}
          />
        </div>
      </CardFooter>
    </Card>
  )
}

const routeCardToneStyles: Record<
  RouteCardTone,
  {
    card: string
    header: string
  }
> = {
  best: {
    card: "border-emerald-200/80",
    header: "border-l-emerald-600 bg-emerald-50/80",
  },
  medium: {
    card: "border-amber-200/90",
    header: "border-l-amber-500 bg-amber-50/80",
  },
  weak: {
    card: "border-rose-200/90",
    header: "border-l-rose-500 bg-rose-50/80",
  },
  blocked: {
    card: "border-zinc-300/90 opacity-90",
    header: "border-l-zinc-950 bg-zinc-100/80",
  },
}

function getDifficultyBadgeStyle(
  level: RouteAssessment["difficulty"]["level"]
) {
  if (level <= 2) {
    return {
      scoreBadge: "bg-emerald-700 text-white",
      subtleBadge: "border-emerald-200 bg-emerald-50 text-emerald-950",
    }
  }

  if (level === 3) {
    return {
      scoreBadge: "bg-amber-600 text-white",
      subtleBadge: "border-amber-200 bg-amber-50 text-amber-950",
    }
  }

  return {
    scoreBadge: "bg-rose-700 text-white",
    subtleBadge: "border-rose-200 bg-rose-50 text-rose-950",
  }
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-2 rounded-md border bg-background p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
      <span className="mt-0.5 text-primary [&_svg]:size-4">{icon}</span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-sm leading-5">{value}</span>
      </span>
    </div>
  )
}

function MetricLine({
  metric,
}: {
  metric: ReturnType<typeof buildRouteMetricSummaries>[number]
}) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {metric.label}
        </span>
        <span className="text-right text-sm font-medium">{metric.value}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {metric.description}
      </p>
    </div>
  )
}

function RouteList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="flex flex-col gap-1 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function getStatusVariant(status: RouteAssessment["status"]) {
  if (status === "available") {
    return "secondary"
  }

  return "outline"
}
