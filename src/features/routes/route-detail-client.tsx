"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react"

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
import { assessRoutes } from "@/domain/assessment"
import {
  getCountryFromCatalogue,
  getSourcesFromCatalogue,
  type ContentCatalogue,
} from "@/domain/content-catalogue"
import { buildRouteMetricSummaries } from "@/domain/assessment-display"
import { countryStatusLabels, getReviewFreshness } from "@/domain/countries"
import type {
  RouteAssessment,
  RouteDefinition,
  RouteSource,
} from "@/domain/types"
import { summarizeProfile } from "@/features/questionnaire/profile-labels"
import {
  parseStoredProfile,
  readStoredProfileSnapshot,
  subscribeStoredProfile,
} from "@/features/questionnaire/profile-storage"

type RouteDetailClientProps = {
  catalogue: ContentCatalogue
  route: RouteDefinition
}

export function RouteDetailClient({
  catalogue,
  route,
}: RouteDetailClientProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const rawProfile = useSyncExternalStore(
    subscribeStoredProfile,
    readStoredProfileSnapshot,
    () => ""
  )
  const profile = useMemo(() => parseStoredProfile(rawProfile), [rawProfile])
  const assessment = useMemo<RouteAssessment | null>(() => {
    if (!profile) {
      return null
    }

    return assessRoutes(profile, { ...catalogue, routes: [route] })[0] ?? null
  }, [catalogue, profile, route])

  const country = getCountryFromCatalogue(catalogue, route.countryCode)
  const sources = getSourcesFromCatalogue(catalogue, route.sourceIds)
  const documents = assessment?.documents ?? route.documents
  const blockers = assessment?.blockers ?? route.risks
  const whyFits = assessment?.whyFits ?? [
    "Это справочный маршрут из базы Relogator. Пройдите анкету, чтобы увидеть персональную оценку.",
  ]
  const activeStep = route.steps[activeStepIndex] ?? route.steps[0]
  const activeCommonMistakes = filterDisplayedCommonMistakes(
    activeStep.commonMistakes
  )
  const activeStepSources = getSourcesFromCatalogue(
    catalogue,
    activeStep.sourceIds
  )
  const activeStepActions = buildStepActionItems(
    route,
    activeStepIndex,
    assessment
  )
  const activeStepNotes = buildStepImportantNotes(
    route,
    activeStepIndex,
    assessment
  )
  const activeStepOfficialActions = buildStepOfficialActions(
    route,
    activeStepIndex,
    activeStepSources
  )
  const metricSummaries = assessment
    ? buildRouteMetricSummaries(assessment)
    : null
  const routeReviewFreshness = getReviewFreshness(route.lastReviewedAt)

  return (
    <>
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/results">
          <ArrowLeft data-icon="inline-start" />
          Назад к результатам
        </Link>
      </Button>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{country.name}</Badge>
              <Badge variant="outline">
                {countryStatusLabels[country.status]}
              </Badge>
              <Badge variant="outline">Проверено: {route.lastReviewedAt}</Badge>
              {routeReviewFreshness && (
                <Badge
                  variant="outline"
                  className={
                    routeReviewFreshness.tone === "risk"
                      ? "border-rose-200 bg-rose-50 text-rose-950"
                      : "border-amber-200 bg-amber-50 text-amber-950"
                  }
                >
                  {routeReviewFreshness.label}
                </Badge>
              )}
              <Badge variant={assessment ? "secondary" : "outline"}>
                {assessment ? assessment.difficulty.label : "справочник"}
              </Badge>
              {assessment && (
                <Badge variant="outline">{assessment.statusLabel}</Badge>
              )}
            </div>
            <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight">
              {route.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {route.shortDescription}
            </p>
          </div>

          <LegalNotice compact />

          {!profile && (
            <Card className="rounded-lg border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle>Справочный режим</CardTitle>
                <CardDescription className="text-amber-950">
                  Сейчас показан общий маршрут без персональной оценки. Пройдите
                  анкету, чтобы увидеть сложность, документы и ограничения по
                  вашим вводным.
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

          <Card className="overflow-hidden rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>
                <h2>Пошаговый план</h2>
              </CardTitle>
              <CardDescription>
                Проходите маршрут по шагам: проверка вводных, документы, выезд,
                въезд и действия после прибытия.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 xl:grid-cols-[190px_minmax(0,1fr)]">
              <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                {route.steps.map((step, index) => (
                  <li key={step.title} className="min-w-44 lg:min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex(index)}
                      className={
                        index === activeStepIndex
                          ? "flex w-full items-start gap-2 rounded-md border border-primary bg-secondary p-2 text-left text-sm shadow-sm"
                          : "flex w-full items-start gap-2 rounded-md border bg-background p-2 text-left text-sm hover:bg-muted"
                      }
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="leading-5">{step.title}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <article className="flex min-w-0 flex-col gap-5 rounded-lg border bg-background p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      Шаг {activeStepIndex + 1} из {route.steps.length}
                    </span>
                    <span>Проверено: {route.lastReviewedAt}</span>
                  </div>
                  <h2 className="font-heading text-2xl font-semibold leading-tight">
                    {activeStep.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {activeStep.description}
                  </p>
                </div>

                <section className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium">Что сделать сейчас</h3>
                  <ol className="grid gap-2">
                    {activeStepActions.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 rounded-md border bg-card p-3 text-sm leading-6 shadow-sm"
                      >
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-secondary/45 p-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">
                      Официальная проверка
                    </h3>
                  </div>
                  <ul className="grid gap-2">
                    {activeStepOfficialActions.map((item) => (
                      <li key={item} className="text-sm leading-6">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-2">
                    {activeStepSources.map((source) => (
                      <a
                        key={source.id}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm hover:bg-muted"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            {source.title}
                          </span>
                          <span className="block text-muted-foreground">
                            {source.description}. Проверено:{" "}
                            {source.lastReviewedAt}
                          </span>
                        </span>
                        <ExternalLink className="mt-0.5 size-4 shrink-0" />
                      </a>
                    ))}
                  </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailList
                    title="Документы на этом шаге"
                    items={activeStep.documents}
                  />
                  <DetailList title="Важно не забыть" items={activeStepNotes} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {activeCommonMistakes.length > 0 && (
                    <DetailList
                      title="Частые ошибки"
                      items={activeCommonMistakes}
                    />
                  )}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">
                      Когда нужен специалист
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {activeStep.specialistHelp}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activeStepIndex === 0}
                    onClick={() =>
                      setActiveStepIndex((current) => Math.max(0, current - 1))
                    }
                  >
                    <ArrowLeft data-icon="inline-start" />
                    Назад
                  </Button>
                  <Button
                    type="button"
                    disabled={activeStepIndex === route.steps.length - 1}
                    onClick={() =>
                      setActiveStepIndex((current) =>
                        Math.min(route.steps.length - 1, current + 1)
                      )
                    }
                  >
                    Далее
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </div>
              </article>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
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
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {metricSummaries?.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex flex-col gap-1 rounded-md border bg-background p-3"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {metric.label}
                      </span>
                      <span className="text-sm font-medium">
                        {metric.value}
                      </span>
                      <span className="text-xs leading-5 text-muted-foreground">
                        {metric.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-5 md:grid-cols-3">
                <DetailList
                  title="Почему подходит"
                  items={whyFits.slice(0, 4)}
                />
                <DetailList
                  title="Что может помешать"
                  items={blockers.slice(0, 4)}
                />
                <DetailList
                  title="Что улучшит маршрут"
                  items={
                    assessment?.unlocks.length
                      ? assessment.unlocks.slice(0, 4)
                      : ["Сверить источник и уточнить вводные перед действием."]
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          {profile && (
            <Card className="rounded-lg shadow-sm">
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

          <Card className="rounded-lg shadow-sm">
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

          <Card className="rounded-lg shadow-sm">
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

function filterDisplayedCommonMistakes(items: string[]) {
  return items.filter(
    (item) => !/справочн[а-яё]*\s+страниц[а-яё]*\s+гарантией/iu.test(item)
  )
}

function buildStepActionItems(
  route: RouteDefinition,
  stepIndex: number,
  assessment: RouteAssessment | null
) {
  const requirements = route.requirements
  const routeBasis = getRouteBasis(route)
  const passportText =
    requirements.minPassportMonths > 0
      ? `Проверьте, что загранпаспорт действует минимум ${requirements.minPassportMonths} месяцев на момент ключевого действия по маршруту.`
      : "Проверьте срок действия загранпаспорта и совпадение данных во всех документах."
  const sourceText =
    "Откройте официальный источник по шагу и сохраните страницу или PDF в папку маршрута."

  const actionItemsByStep = [
    [
      `Сформулируйте цель маршрута: ${routeBasis}. Сверьте ее со сроком пребывания и бюджетом из анкеты.`,
      passportText,
      `Проверьте главное ограничение маршрута: ${route.risks[0] ?? "правила могут измениться до подачи документов."}`,
      sourceText,
    ],
    [
      `Соберите базовый комплект: ${route.documents.slice(0, 4).join(", ")}.`,
      requirements.criminalRecordCertificate
        ? "Закажите справку о несудимости заранее: в РФ ее обычно получают через Госуслуги, МВД или МФЦ, а затем проверяют требования к переводу и заверению для целевой страны."
        : "Если справка о несудимости не указана как обязательная в маршруте, все равно проверьте, не понадобится ли она для следующего статуса.",
      requirements.translations
        ? "Составьте список документов для перевода, нотариального заверения или апостиля до покупки невозвратных билетов."
        : "Отделите оригиналы от копий и сделайте цифровые копии паспорта, страховки, билетов и подтверждений адреса.",
      requirements.provableIncome
        ? "Подготовьте подтверждение дохода: договор, выписку, справку работодателя или документы бизнеса в том виде, который принимает орган страны."
        : "Подготовьте финансовый запас и простое объяснение цели поездки, даже если подтверждение дохода не является основой маршрута.",
    ],
    [
      "Проверьте маршрут поездки, даты, багаж, связь и адрес первых дней проживания.",
      route.entryType === "visa_free"
        ? "Для безвизового въезда проверьте не только право въезда, но и лимит дней, порядок продления и правила обратного билета."
        : "Для визы или ВНЖ держите отдельно пакет для подачи: заявление, основание, фото, пошлины, подтверждения записи и оплат.",
      "Сохраните копии документов в облаке и на телефоне, а оригиналы держите в ручной клади.",
      sourceText,
    ],
    [
      "После пересечения границы сразу зафиксируйте дату въезда, штамп или электронное подтверждение.",
      "Проверьте, совпадают ли имя, номер паспорта и даты в отметках, билетах, страховке и документах на жилье.",
      "Если на границе задали дополнительные вопросы или поставили нестандартную отметку, не откладывайте консультацию.",
      "Запишите крайний срок, когда нужно сделать следующий шаг: регистрация адреса, подача, продление или выезд.",
    ],
    [
      "Закройте бытовую базу: адрес, связь, страховка, транспорт, доступ к деньгам и связь с арендодателем.",
      route.supports.bankAccount
        ? "Если нужен банковский счет, проверьте список документов банка отдельно: миграционные правила и банковские правила часто отличаются."
        : "Если банковский счет не является сильной стороной маршрута, заранее подготовьте запасной способ оплаты и получения денег.",
      route.supports.children
        ? "Для детей отдельно проверьте школу, детский сад, медицинские документы и согласия родителей."
        : "Если едете без детей, не добавляйте семейные документы в основной пакет без причины, чтобы не усложнить подачу.",
      route.supports.pets
        ? "Для животного проверьте ветеринарные требования, чип, прививки, справки и правила перевозчика."
        : "Если животного нет, не тратьте время на этот блок и переходите к основанию пребывания.",
    ],
    [
      route.entryType === "visa_free"
        ? "Примите решение по следующему статусу: выезд, продление, ВНЖ, учеба, работа или бизнес."
        : "Проверьте запись, заявление, пошлину, комплект документов и сроки рассмотрения по выбранному статусу.",
      requirements.employmentContract || requirements.businessOrEmploymentBasis
        ? "Если основание связано с работой, проверьте договор, должность, срок, право на работу и требования работодателя."
        : "Если работа не является основанием, не подавайте маршрут как рабочий без подтверждающего договора.",
      requirements.businessBasis || requirements.businessOrEmploymentBasis
        ? "Если основание связано с бизнесом, подготовьте регистрацию, договоры, счета, описание деятельности и подтверждение реальности бизнеса."
        : "Если бизнес не является основанием, не открывайте компанию только ради галочки без понимания расходов и налогов.",
      "Сохраните подтверждения подачи, квитанции, входящие номера и контакты органа или консульства.",
    ],
    [
      "За 30-45 дней до окончания разрешенного срока проверьте остаток дней и статус всех заявлений.",
      "Соберите запасной план: выезд, новая подача, продление, смена основания или консультация.",
      assessment?.blockers.length
        ? `Отдельно проверьте блокер из вашей анкеты: ${assessment.blockers[0]}.`
        : "Если маршрут подходит по анкете, все равно перепроверьте сроки и источники перед оплатой невозвратных расходов.",
      "Не ждите последней недели: справки, переводы, запись и ответы органов часто занимают больше времени, чем кажется.",
    ],
    [
      "Обращайтесь к специалисту до просрочки, отказа или покупки дорогих невозвратных услуг.",
      "Перед консультацией подготовьте ответы анкеты, текущий комплект документов, сроки, бюджет и конкретные вопросы.",
      "Попросите специалиста отдельно отметить: что подтверждено официальным источником, что является практикой, а что остается неопределенным.",
      "Не принимайте обещание гарантированного результата: итоговое решение принимает компетентный орган страны.",
    ],
  ]

  return actionItemsByStep[stepIndex] ?? actionItemsByStep[0]
}

function buildStepOfficialActions(
  route: RouteDefinition,
  stepIndex: number,
  sources: RouteSource[]
) {
  const primarySource = sources[0]
  const sourceTitle = primarySource?.title ?? "официальный источник"

  if (route.id === "vietnam-evisa-90-reference") {
    return buildVietnamEvisaActions(stepIndex, sourceTitle)
  }

  if (route.entryType === "visa_free") {
    return [
      `Откройте ${sourceTitle} и проверьте лимит дней для граждан РФ, требования к паспорту и условия въезда на ваши даты.`,
      "Запишите крайний день законного пребывания и отдельный срок, когда нужно решить вопрос с выездом, продлением или новым основанием.",
      "Если планируете жить дольше первичного срока, сразу откройте правила продления или перехода на ВНЖ, а не ждите последних дней.",
    ]
  }

  if (route.entryType === "residence_permit") {
    return [
      `Откройте ${sourceTitle} и найдите раздел подачи на ВНЖ или долгосрочный статус по вашему основанию.`,
      "Сверьте официальный список документов с вашим комплектом: паспорт, основание, адрес, финансы, страховка, справки и переводы.",
      "Перед оплатой пошлин или записи сохраните страницу с требованиями и дату проверки, чтобы видеть, по какой версии правил вы готовились.",
    ]
  }

  return [
    `Откройте ${sourceTitle} и найдите раздел временного проживания, визы или регистрации по вашему основанию.`,
    "Сверьте, где подается заявление: онлайн, через консульство, миграционный орган или местную администрацию.",
    "Сохраните подтверждение записи, оплаты или подачи, если действие уже доступно на этом шаге.",
  ]
}

function buildVietnamEvisaActions(stepIndex: number, sourceTitle: string) {
  const actionsByStep = [
    [
      `Откройте ${sourceTitle} и проверьте, что подача e-visa доступна для граждан РФ на выбранные даты и пункт въезда.`,
      "Проверьте срок паспорта, планируемую дату въезда, срок пребывания до 90 дней и пункт въезда/выезда.",
      "Не покупайте невозвратные билеты, пока не понимаете, какую визу и на какие даты будете оформлять.",
    ],
    [
      `На ${sourceTitle} начните подготовку e-visa: паспортные данные, фото, скан страницы паспорта, даты, пункт въезда/выезда и адрес во Вьетнаме.`,
      "Заранее подготовьте карту для оплаты визового сбора и проверьте, что имя и номер паспорта совпадают с загранпаспортом.",
      "После отправки заявления сохраните номер заявки, скрин подтверждения и дату, когда нужно проверить статус.",
    ],
    [
      `Перед выездом откройте ${sourceTitle} и проверьте статус e-visa; если виза одобрена, сохраните PDF и распечатайте копию.`,
      "Сверьте даты действия e-visa с билетами, страховкой и адресом проживания на первое время.",
      "Держите PDF e-visa, паспорт, страховку и адрес жилья в телефоне и отдельно в распечатке.",
    ],
    [
      "На границе покажите паспорт и e-visa; после въезда проверьте штамп или электронную отметку и фактическую дату въезда.",
      "Сразу запишите дату окончания разрешенного срока, чтобы не считать ее по памяти.",
      "Если данные в отметке отличаются от e-visa, решайте это сразу, а не перед выездом.",
    ],
    [
      "В первые дни подтвердите адрес проживания, связь, страховку и доступ к деньгам.",
      "Если жилье меняется, уточните у арендодателя, есть ли местные требования к регистрации или уведомлению.",
      "Если едете не один, отдельно проверьте документы каждого члена семьи: e-visa, паспорт, страховка, адрес.",
    ],
    [
      "Если хотите остаться дольше срока e-visa, заранее ищите другой законный маршрут: новая виза, выезд и новая подача, работа, учеба или другое основание.",
      "Не считайте e-visa основанием для работы или долгого проживания: это отдельный краткосрочный въездной документ.",
      "Соберите подтверждения проживания, расходов и выезда, если они понадобятся при следующей подаче.",
    ],
    [
      "За 30-45 дней до окончания e-visa проверьте остаток дней и выберите: выезд, новый въездной сценарий или консультация по долгому основанию.",
      "Не оставляйте продление или новую подачу на последние дни: ошибка в датах может привести к просрочке.",
      "Сохраните билеты или другой план законного выезда, если долгий статус не оформлен.",
    ],
    [
      "Обратитесь к специалисту, если была ошибка в e-visa, отказ, просрочка, нестандартный состав семьи или цель дольше туристического пребывания.",
      "Перед консультацией подготовьте PDF e-visa, паспорт, даты въезда/выезда, адрес и вопрос, который нужно решить.",
      "Просите отделить официальное правило от практического совета: e-visa не равна ВНЖ.",
    ],
  ]

  return actionsByStep[stepIndex] ?? actionsByStep[0]
}

function buildStepImportantNotes(
  route: RouteDefinition,
  stepIndex: number,
  assessment: RouteAssessment | null
) {
  const baseNotes = [
    `Маршрут: ${route.title}.`,
    `Тип входа: ${getEntryTypeLabel(route.entryType)}.`,
    `Ожидаемая подготовка: ${route.timeline.label}.`,
  ]

  if (assessment) {
    baseNotes.push(`Ваша текущая оценка: ${assessment.difficulty.label}.`)
  }

  if (stepIndex <= 2 && route.requirements.translations) {
    baseNotes.push(
      "Переводы, нотариальные действия и апостиль проверяйте до выезда: часть документов проще оформить в РФ."
    )
  }

  if (stepIndex <= 2 && route.requirements.criminalRecordCertificate) {
    baseNotes.push(
      "Справка о несудимости имеет срок актуальности для многих подач, поэтому ее нужно заказывать с учетом даты подачи."
    )
  }

  if (stepIndex >= 5) {
    baseNotes.push(
      "Держите календарь сроков: дата въезда, дедлайн подачи, срок ответа органа и крайний день законного пребывания."
    )
  }

  return baseNotes
}

function getRouteBasis(route: RouteDefinition) {
  if (route.entryType === "visa_free") {
    return "въехать без визы, прожить разрешенный срок и заранее выбрать следующий статус"
  }

  if (route.requirements.businessBasis) {
    return "подтвердить бизнес-основание и подготовить пакет для долгого статуса"
  }

  if (route.requirements.employmentContract) {
    return "подтвердить работу или приглашение работодателя и подать документы по этому основанию"
  }

  if (route.requirements.businessOrEmploymentBasis) {
    return "подтвердить работу, бизнес или другое допустимое основание для подачи"
  }

  return "подтвердить основание пребывания и собрать документы по официальному списку"
}

function getEntryTypeLabel(entryType: RouteDefinition["entryType"]) {
  if (entryType === "visa_free") {
    return "безвизовый въезд"
  }

  if (entryType === "residence_permit") {
    return "ВНЖ или долгий статус"
  }

  return "временное проживание"
}
