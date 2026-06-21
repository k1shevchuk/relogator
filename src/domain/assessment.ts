import { getCountry } from "./countries"
import { getSources } from "./sources"
import { routes as defaultRoutes } from "./routes"
import type {
  AnswerImpact,
  AssessmentScale,
  AssessmentScales,
  DifficultyLevel,
  MoneyLevel,
  MonthlyIncomeLevel,
  RouteAssessment,
  RouteAvailabilityStatus,
  RouteDefinition,
  UserProfile,
} from "./types"

const difficultyLabels: Record<DifficultyLevel, string> = {
  1: "очень простой",
  2: "простой",
  3: "средний",
  4: "сложный",
  5: "очень сложный",
}

const statusLabels: Record<RouteAvailabilityStatus, string> = {
  available: "можно начинать сейчас",
  conditional: "можно после подготовки",
  unknown: "сложно, но возможно",
  blocked: "не подходит по текущим ответам",
}

const statusRank: Record<RouteAvailabilityStatus, number> = {
  available: 1,
  conditional: 2,
  unknown: 3,
  blocked: 4,
}

const passportMonths: Record<UserProfile["passportStatus"], number> = {
  more_than_18_months: 24,
  six_to_18_months: 12,
  less_than_6_months: 5,
  none: 0,
}

const moneyRank: Record<MoneyLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
}

const incomeRank: Record<MonthlyIncomeLevel, number> = {
  none: 0,
  under_one_thousand: 1,
  one_to_three_thousand: 2,
  three_thousand_plus: 3,
}

export function assessRoutes(
  profile: UserProfile,
  catalogue: RouteDefinition[] = defaultRoutes
): RouteAssessment[] {
  return catalogue
    .map((route) => assessRoute(profile, route))
    .filter((assessment): assessment is RouteAssessment => Boolean(assessment))
    .sort(compareAssessments)
}

export function simulateAnswerImpact<TField extends keyof UserProfile>(
  profile: UserProfile,
  field: TField,
  value: UserProfile[TField],
  catalogue: RouteDefinition[] = defaultRoutes
): AnswerImpact<TField> {
  const before = assessRoutes(profile, catalogue)
  const afterProfile = { ...profile, [field]: value }
  const after = assessRoutes(afterProfile, catalogue)
  const beforeById = new Map(
    before.map((assessment) => [assessment.route.id, assessment])
  )

  const changedRoutes = after
    .map((next) => {
      const previous = beforeById.get(next.route.id)

      if (!previous) {
        return null
      }

      const beforeRank = statusRank[previous.status]
      const afterRank = statusRank[next.status]
      const statusChanged = beforeRank !== afterRank
      const difficultyChanged =
        previous.difficulty.level !== next.difficulty.level
      const blockersChanged =
        previous.blockers.join("\n") !== next.blockers.join("\n")

      if (!statusChanged && !difficultyChanged && !blockersChanged) {
        return null
      }

      return {
        routeId: next.route.id,
        countryName: next.country.name,
        routeTitle: next.route.title,
        beforeStatus: previous.status,
        afterStatus: next.status,
        beforeDifficulty: previous.difficulty.level,
        afterDifficulty: next.difficulty.level,
        change: classifyChange(previous, next),
      }
    })
    .filter((item): item is AnswerImpact<TField>["changedRoutes"][number] =>
      Boolean(item)
    )

  return {
    field,
    value,
    summary: buildImpactSummary(field, value, changedRoutes),
    changedRoutes,
  }
}

function assessRoute(
  profile: UserProfile,
  route: RouteDefinition
): RouteAssessment | null {
  if (
    route.publicationStatus === "archived" ||
    route.publicationStatus === "draft"
  ) {
    return null
  }

  const sourceList = getSources(route.sourceIds)

  if (sourceList.length === 0) {
    return null
  }

  const country = getCountry(route.countryCode)
  const whyFits = buildWhyFits(profile, route)
  const documents = new Set(route.documents)
  const blockers = [...route.risks]
  const unlocks: string[] = []
  const hardBlockers: string[] = []
  let difficulty = route.baseDifficulty

  if (
    passportMonths[profile.passportStatus] <
    route.requirements.minPassportMonths
  ) {
    const reason =
      profile.passportStatus === "none"
        ? "Нет действующего загранпаспорта для этого маршрута."
        : `Срок паспорта меньше требуемых ${route.requirements.minPassportMonths} месяцев.`
    hardBlockers.push(reason)
    blockers.push(reason)
    unlocks.push(
      "Оформить или заменить загранпаспорт до планирования маршрута."
    )
    difficulty = 5
  }

  if (!route.goals.includes(profile.goal) && profile.goal !== "compare") {
    const reason = "Маршрут не совпадает с выбранной целью анкеты."
    hardBlockers.push(reason)
    blockers.push(reason)
    unlocks.push(
      "Изменить цель или рассматривать маршрут только как справочный."
    )
  }

  if (!route.stayDurations.includes(profile.stayDuration)) {
    const reason = "Планируемый срок не совпадает с допустимым сроком маршрута."
    hardBlockers.push(reason)
    blockers.push(reason)
    unlocks.push(
      "Изменить срок пребывания или выбрать маршрут с подходящим сроком."
    )
  }

  if (profile.companions.includes("children") && !route.supports.children) {
    const reason = "Маршрут не рассчитан на сценарий с детьми."
    hardBlockers.push(reason)
    blockers.push(reason)
    unlocks.push(
      "Выбрать семейный маршрут или проверить отдельное основание для детей."
    )
  }

  if (profile.companions.includes("pets") && !route.supports.pets) {
    const reason = "Маршрут не учитывает переезд с животным."
    hardBlockers.push(reason)
    blockers.push(reason)
    unlocks.push(
      "Проверить ветеринарные правила и выбрать pet-friendly маршрут."
    )
  }

  if (route.requirements.provableIncome && !profile.hasProvableIncome) {
    blockers.push("Нужно подтвердить регулярный доход.")
    unlocks.push(
      "Подготовить выписки, договоры, справки или налоговые документы о доходе."
    )
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    route.requirements.minimumMonthlyIncomeLevel &&
    incomeRank[profile.monthlyIncomeLevel] <
      incomeRank[route.requirements.minimumMonthlyIncomeLevel]
  ) {
    blockers.push("Подтверждаемый доход ниже уровня, который нужен маршруту.")
    unlocks.push(
      "Подтвердить более высокий доход или выбрать менее дорогой маршрут."
    )
    difficulty = incrementDifficulty(difficulty)
  }

  if (route.requirements.employmentContract && !profile.hasEmploymentContract) {
    blockers.push("Нужен трудовой договор или рабочее основание.")
    unlocks.push(
      "Получить предложение работы или выбрать маршрут без работодателя."
    )
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    route.requirements.businessBasis &&
    !profile.hasBusiness &&
    !profile.willingToOpenCompany
  ) {
    blockers.push(
      "Нужно действующее бизнес-основание или готовность открыть компанию."
    )
    unlocks.push(
      "Подготовить документы бизнеса или выбрать небизнесовый маршрут."
    )
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    route.requirements.businessOrEmploymentBasis &&
    !profile.hasBusiness &&
    !profile.willingToOpenCompany &&
    !profile.hasEmploymentContract
  ) {
    blockers.push("Нужно рабочее или бизнес-основание.")
    unlocks.push(
      "Получить трудовой договор, открыть бизнес или выбрать другой маршрут."
    )
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    profile.goal === "business" &&
    route.requirements.businessOrEmploymentBasis &&
    !profile.hasBusiness &&
    !profile.willingToOpenCompany
  ) {
    blockers.push("Для бизнес-цели нужно бизнес-основание, а не только работа.")
    unlocks.push("Подготовить бизнес-основание или изменить цель анкеты.")
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    profile.departureWindow === "two_weeks" &&
    route.timeline.preparationDays > 14
  ) {
    blockers.push("Подготовка обычно дольше двух недель.")
    unlocks.push("Увеличить срок подготовки хотя бы до 1-3 месяцев.")
    difficulty = incrementDifficulty(difficulty)
  }

  addCompanionDocuments(profile, documents)

  if (
    route.requirements.translations &&
    (profile.translationReadiness === "not_ready" ||
      profile.translationReadiness === "dont_understand")
  ) {
    blockers.push("Потребуются переводы, заверения или апостиль документов.")
    unlocks.push(
      "Разобраться с переводами и заверениями или подключить специалиста."
    )
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    route.requirements.translations &&
    profile.translationReadiness === "needs_specialist"
  ) {
    blockers.push("Переводы и заверения лучше планировать со специалистом.")
    unlocks.push("Получить список документов и оценку сроков переводов.")
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    route.requirements.criminalRecordCertificate &&
    !profile.hasCriminalRecordCertificate
  ) {
    blockers.push("Нужна справка о несудимости, ее стоит заказать заранее.")
    unlocks.push("Подготовить справку о несудимости до подачи.")
    difficulty = incrementDifficulty(difficulty)
  }

  if (
    route.requirements.minimumSavingsLevel &&
    moneyRank[profile.savingsLevel] <
      moneyRank[route.requirements.minimumSavingsLevel]
  ) {
    blockers.push("Текущий запас средств ниже рекомендуемого для маршрута.")
    unlocks.push(
      "Увеличить финансовый запас или выбрать более дешевый маршрут."
    )
    difficulty = incrementDifficulty(difficulty)
  }

  if (profile.valuesLowCost && !route.supports.lowCost) {
    blockers.push("Направление может быть дороже ожидаемого.")
    difficulty = incrementDifficulty(difficulty)
  }

  const status = getStatus(route, country.status, hardBlockers, blockers)
  const scales = buildScales(profile, route, status, blockers, documents.size)
  const aggregateDifficulty = clampDifficulty(
    Math.max(difficulty, averageScaleLevel(scales))
  )

  return {
    route,
    country,
    status,
    statusLabel: statusLabels[status],
    difficulty: {
      level: aggregateDifficulty,
      label: difficultyLabels[aggregateDifficulty],
    },
    scales,
    whyFits: whyFits.length
      ? whyFits
      : ["Маршрут оставлен в выдаче для сравнения условий и ограничений."],
    blockers,
    unlocks: Array.from(new Set(unlocks)),
    documents: Array.from(documents),
    timeline: route.timeline.label,
    cost: route.cost.label,
    lastReviewedAt: route.lastReviewedAt,
    sources: sourceList,
  }
}

function buildWhyFits(profile: UserProfile, route: RouteDefinition): string[] {
  const reasons: string[] = []

  if (route.entryType === "visa_free") {
    reasons.push("Можно начать маршрут без визы для первого этапа.")
  }

  if (route.goals.includes(profile.goal)) {
    reasons.push("Маршрут соответствует выбранной цели анкеты.")
  }

  if (profile.hasProvableIncome && route.supports.remoteWork) {
    reasons.push("Подтверждаемый доход помогает обосновать удаленный формат.")
  }

  if (profile.companions.includes("children") && route.supports.children) {
    reasons.push("Маршрут допускает семейный сценарий с детьми.")
  }

  if (profile.companions.includes("pets") && route.supports.pets) {
    reasons.push("Можно планировать переезд с животным при готовых документах.")
  }

  if (profile.valuesRussianSpeaking && route.supports.russianSpeaking) {
    reasons.push("Есть более понятная русскоязычная среда для адаптации.")
  }

  if (profile.valuesWarmClimate && route.supports.warmClimate) {
    reasons.push("Направление подходит под запрос на теплый климат.")
  }

  if (profile.valuesLowCost && route.supports.lowCost) {
    reasons.push("Стартовые расходы относительно ниже других направлений.")
  }

  return reasons
}

function addCompanionDocuments(
  profile: UserProfile,
  documents: Set<string>
): void {
  if (profile.companions.includes("partner")) {
    documents.add("Свидетельство о браке или документ о партнерстве")
  }

  if (profile.companions.includes("parents")) {
    documents.add("Документы, подтверждающие родство с родителями")
  }

  if (profile.companions.includes("children")) {
    documents.add("Свидетельства о браке и рождении детей")

    if (profile.needsSchool) {
      documents.add("Документы для школы или детского сада")
    }
  }

  if (profile.companions.includes("pets")) {
    documents.add("Ветеринарный паспорт и документы животного")
  }
}

function getStatus(
  route: RouteDefinition,
  countryStatus: RouteAssessment["country"]["status"],
  hardBlockers: string[],
  blockers: string[]
): RouteAvailabilityStatus {
  if (hardBlockers.length > 0) {
    return "blocked"
  }

  if (route.publicationStatus === "stale") {
    return blockers.length > route.risks.length ? "conditional" : "unknown"
  }

  if (countryStatus !== "reviewed") {
    return blockers.length > route.risks.length ? "conditional" : "unknown"
  }

  if (blockers.length > route.risks.length) {
    return "conditional"
  }

  if (route.confidence === "low") {
    return "unknown"
  }

  return "available"
}

function buildScales(
  profile: UserProfile,
  route: RouteDefinition,
  status: RouteAvailabilityStatus,
  blockers: string[],
  documentCount: number
): AssessmentScales {
  const documents = clampDifficulty(
    route.baseDifficulty +
      (documentCount >= 5 ? 1 : 0) +
      (route.requirements.translations ? 1 : 0) +
      (route.requirements.criminalRecordCertificate ? 1 : 0)
  )
  const cost = clampDifficulty(
    costRank(route.cost.level) +
      (route.requirements.minimumSavingsLevel &&
      moneyRank[profile.savingsLevel] <
        moneyRank[route.requirements.minimumSavingsLevel]
        ? 1
        : 0)
  )
  const approvalRisk = clampDifficulty(
    route.baseDifficulty +
      (route.confidence === "high" ? 0 : 1) +
      (status === "unknown" ? 1 : 0) +
      (status === "blocked" ? 2 : 0) +
      (blockers.length >= 3 ? 1 : 0)
  )
  const speed = clampDifficulty(
    route.timeline.preparationDays <= 14
      ? 1
      : route.timeline.preparationDays <= 45
        ? 3
        : route.timeline.preparationDays <= 90
          ? 4
          : 5
  )
  const adaptation = clampDifficulty(
    2 +
      (profile.companions.includes("children") && !route.supports.children
        ? 2
        : 0) +
      (profile.companions.includes("pets") && !route.supports.pets ? 1 : 0) +
      (profile.valuesRussianSpeaking && !route.supports.russianSpeaking
        ? 1
        : 0) +
      (profile.valuesLowCost && !route.supports.lowCost ? 1 : 0)
  )

  return {
    documents: makeScale(
      documents,
      "Документы",
      route.requirements.translations
        ? ["Потребуются переводы, заверения или апостиль."]
        : ["Комплект документов сравнительно прямой."]
    ),
    cost: makeScale(cost, "Расходы", [route.cost.label]),
    approvalRisk: makeScale(
      approvalRisk,
      "риск отказа или дополнительного запроса",
      [
        status === "available"
          ? "По текущим ответам нет явного блокирующего условия."
          : "Есть условия, которые компетентный орган может проверить дополнительно.",
      ]
    ),
    speed: makeScale(speed, "Срок", [route.timeline.label]),
    adaptation: makeScale(adaptation, "Адаптация", [
      route.supports.russianSpeaking
        ? "Есть более понятная русскоязычная среда."
        : "Потребуется больше бытовой адаптации.",
    ]),
  }
}

function makeScale(
  level: DifficultyLevel,
  label: string,
  reasons: string[]
): AssessmentScale {
  return {
    level,
    label: `${label}: ${difficultyLabels[level]}`,
    reasons,
  }
}

function incrementDifficulty(level: DifficultyLevel): DifficultyLevel {
  return Math.min(5, level + 1) as DifficultyLevel
}

function clampDifficulty(value: number): DifficultyLevel {
  return Math.min(5, Math.max(1, Math.round(value))) as DifficultyLevel
}

function averageScaleLevel(scales: AssessmentScales): DifficultyLevel {
  const sum = Object.values(scales).reduce(
    (total, item) => total + item.level,
    0
  )
  return clampDifficulty(sum / Object.values(scales).length)
}

function compareAssessments(
  first: RouteAssessment,
  second: RouteAssessment
): number {
  return (
    statusRank[first.status] - statusRank[second.status] ||
    first.difficulty.level - second.difficulty.level ||
    first.route.timeline.preparationDays -
      second.route.timeline.preparationDays ||
    costRank(first.route.cost.level) - costRank(second.route.cost.level) ||
    first.country.name.localeCompare(second.country.name, "ru") ||
    first.route.id.localeCompare(second.route.id)
  )
}

function costRank(level: RouteDefinition["cost"]["level"]): number {
  if (level === "low") {
    return 1
  }

  if (level === "medium") {
    return 2
  }

  return 3
}

function classifyChange(
  previous: RouteAssessment,
  next: RouteAssessment
): AnswerImpact["changedRoutes"][number]["change"] {
  if (
    statusRank[previous.status] > statusRank[next.status] &&
    next.status !== "blocked"
  ) {
    return "opened"
  }

  if (statusRank[previous.status] < statusRank[next.status]) {
    return next.status === "blocked" ? "blocked" : "harder"
  }

  if (next.difficulty.level < previous.difficulty.level) {
    return "easier"
  }

  if (next.difficulty.level > previous.difficulty.level) {
    return "harder"
  }

  return "changed"
}

function buildImpactSummary<TField extends keyof UserProfile>(
  field: TField,
  value: UserProfile[TField],
  changedRoutes: AnswerImpact<TField>["changedRoutes"]
): string {
  const count = changedRoutes.length

  if (field === "hasCriminalRecordCertificate" && value === true) {
    return `Если подготовить справку о несудимости, изменятся ${count} маршрутов: часть ВНЖ-маршрутов станет доступнее.`
  }

  if (field === "departureWindow" && value === "three_months") {
    return `Если увеличить срок подготовки до 3 месяцев, изменятся ${count} маршрутов: станет легче собрать документы и пройти запись.`
  }

  if (field === "hasProvableIncome" && value === true) {
    return `Если подтвердить доход, изменятся ${count} маршрутов: появятся или станут ближе варианты удаленной работы и ВНЖ по доходу.`
  }

  if (field === "translationReadiness") {
    return `Если подготовиться к переводам и заверениям, изменятся ${count} маршрутов с документальной нагрузкой.`
  }

  return `Если изменить ответ, изменятся ${count} маршрутов в выдаче.`
}
