"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Link2,
  ShieldAlert,
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
import { countryStatusLabels } from "@/domain/countries"
import type { AssessmentScaleKey, RouteAssessment } from "@/domain/types"

type RouteCardProps = {
  assessment: RouteAssessment
}

export function RouteCard({ assessment }: RouteCardProps) {
  return (
    <Card className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <CardHeader className="border-l-4 border-l-primary bg-secondary/35">
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
            >
              {assessment.difficulty.label}
            </Badge>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {assessment.route.shortDescription}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoLine
                icon={<CalendarDays />}
                label="Сроки"
                value={assessment.timeline}
              />
              <InfoLine
                icon={<WalletCards />}
                label="Расходы"
                value={assessment.cost}
              />
              <InfoLine
                icon={<FileText />}
                label="Документы"
                value={`${assessment.documents.length} ключевых пунктов`}
              />
            </div>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Оценка маршрута</span>
              <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                {assessment.difficulty.level}/5
              </span>
            </div>
            <div className="grid gap-2">
              {scaleOrder.map((key) => (
                <ScaleLine
                  key={key}
                  label={scaleLabels[key]}
                  level={assessment.scales[key].level}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
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
            title="Что может открыть"
            items={(assessment.unlocks.length
              ? assessment.unlocks
              : ["Подтвердить вводные и сверить источник перед действием."]
            ).slice(0, 3)}
          />
        </div>
        <Separator />
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <span>
            Проверено: {assessment.lastReviewedAt}. Статус страны:{" "}
            {countryStatusLabels[assessment.country.status]}.
          </span>
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
  approvalRisk: "Риск",
  adaptation: "Адаптация",
}

function ScaleLine({ label, level }: { label: string; level: number }) {
  return (
    <div className="grid grid-cols-[88px_1fr_32px] items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {label === "Риск" && <ShieldAlert className="size-3.5" />}
        {label}
      </span>
      <div
        className="grid grid-cols-5 gap-1"
        aria-label={`${label}: ${level} из 5`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={
              index < level
                ? "h-1.5 rounded-full bg-primary"
                : "h-1.5 rounded-full bg-muted"
            }
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{level}/5</span>
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
