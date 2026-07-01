import { existsSync, readFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.localStorage.setItem("relogator_cookie_notice_accepted", "yes")
  })
})

test("first questionnaire step has no preselected answer", async ({ page }) => {
  await page.goto("/questionnaire")

  await expect(page.locator('[role="radio"][aria-checked="true"]')).toHaveCount(
    0
  )

  await page.getByText("Уехать быстро", { exact: true }).click()

  await expectChoiceChecked(page, "goal-quick_exit")
  await expectChoiceUnchecked(page, "goal-compare")

  await page.getByText("Пока сравниваю варианты", { exact: true }).click()

  await expectChoiceUnchecked(page, "goal-quick_exit")
  await expectChoiceChecked(page, "goal-compare")

  await page.getByText("Уехать быстро", { exact: true }).click()

  await expectChoiceChecked(page, "goal-quick_exit")
  await expectChoiceUnchecked(page, "goal-compare")
})

test("questionnaire radio answers can be changed after selection", async ({
  page,
}) => {
  await page.goto("/questionnaire")

  await page.getByText("Уехать быстро", { exact: true }).click()
  await page.getByRole("button", { name: /Дальше/ }).click()

  await page.getByText("В течение 2 недель", { exact: true }).click()
  await expectChoiceChecked(page, "departureWindow-two_weeks")

  await page.getByText("Пока без срока", { exact: true }).click()
  await expectChoiceUnchecked(page, "departureWindow-two_weeks")
  await expectChoiceChecked(page, "departureWindow-no_deadline")

  await page.getByText("До 1 месяца", { exact: true }).click()
  await expectChoiceChecked(page, "stayDuration-up_to_one_month")

  await page.getByText("Больше года", { exact: true }).click()
  await expectChoiceUnchecked(page, "stayDuration-up_to_one_month")
  await expectChoiceChecked(page, "stayDuration-more_than_year")

  await page.getByText("Да, срок меньше 6 месяцев", { exact: true }).click()
  await expectChoiceChecked(page, "passportStatus-less_than_6_months")

  await page.getByText("Нет", { exact: true }).click()
  await expectChoiceUnchecked(page, "passportStatus-less_than_6_months")
  await expectChoiceChecked(page, "passportStatus-none")
})

test("questionnaire radio cards can be changed by clicking the card", async ({
  page,
}) => {
  await page.goto("/questionnaire")

  await choice(page, "goal-quick_exit").click()
  await expectChoiceChecked(page, "goal-quick_exit")

  await choice(page, "goal-compare").click()
  await expectChoiceUnchecked(page, "goal-quick_exit")
  await expectChoiceChecked(page, "goal-compare")
})

test("questionnaire scroll gesture does not block the next radio choice", async ({
  page,
}) => {
  await page.goto("/questionnaire")

  await choice(page, "goal-quick_exit").click()
  await expectChoiceChecked(page, "goal-quick_exit")

  const compareCard = choice(page, "goal-compare")
  await compareCard.dispatchEvent("pointerdown", {
    clientX: 40,
    clientY: 200,
    pointerId: 1,
    pointerType: "touch",
  })
  await compareCard.dispatchEvent("pointermove", {
    clientX: 40,
    clientY: 140,
    pointerId: 1,
    pointerType: "touch",
  })
  await compareCard.dispatchEvent("pointerup", {
    clientX: 40,
    clientY: 140,
    pointerId: 1,
    pointerType: "touch",
  })

  await compareCard.click()

  await expectChoiceUnchecked(page, "goal-quick_exit")
  await expectChoiceChecked(page, "goal-compare")
})

test("empty questionnaire step cannot be skipped", async ({ page }) => {
  await page.goto("/questionnaire")
  await page.getByRole("button", { name: /Дальше/ }).click()

  await expect(page.getByText("Выберите задачу переезда.")).toBeVisible()
  await expect(
    page.getByText("Шаг 1 из 6: Цель", { exact: true })
  ).toBeVisible()
})

test("user can complete questionnaire and gets a clear login gate for specialist requests", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", {
      name: /Спокойный план переезда по вашим вводным/i,
    })
  ).toBeVisible()
  await page.getByRole("link", { name: "Начать подбор" }).first().click()

  await fillQuestionnaire(page, {
    goal: "Уехать с удаленной работой",
    departure: "В течение 3 месяцев",
    stay: "6-12 месяцев",
    passport: "Да, срок больше 18 месяцев",
    companions: ["С партнером"],
    income: "Да, могу подтвердить",
    incomeLevel: "Больше 3000 долларов/евро",
    savings: "Есть запас на несколько месяцев",
    financeChecks: ["Есть трудовой договор"],
    translation: "Готов, если будет список",
    documentChecks: ["Важен теплый климат"],
  })

  await expect(page).toHaveURL(/\/results/)
  await expect(
    page.getByRole("heading", { name: "Подходящие маршруты", exact: true })
  ).toBeVisible()
  const profilePanel = page.getByText("Анкета и улучшения", { exact: true })
  await expect(profilePanel).toBeVisible()
  await profilePanel.click()
  await expect(page.getByText("Ваши вводные", { exact: true })).toBeVisible()
  await expect(
    page.getByText("Что может упростить маршруты", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Лучшие варианты" }).first()
  ).toBeVisible()
  await expect(page.getByText("Почему подходит").first()).toBeVisible()

  await page
    .getByRole("button", { name: "Задать вопрос специалисту" })
    .first()
    .click()
  await page.getByLabel("Имя").fill("Анна")
  await page.getByLabel("Способ связи").fill("@anna")
  await page
    .getByLabel("Вопрос")
    .fill("Проверьте, какие документы лучше подготовить первыми.")
  await page.getByLabel("Согласие на передачу данных специалисту").click()
  await page.getByRole("button", { name: "Отправить заявку" }).click()
  await expect(page.getByText("Войдите, чтобы отправить заявку")).toBeVisible()
  await expect(
    page.getByRole("main").getByRole("link", { name: "Войти" })
  ).toHaveAttribute("href", "/auth/login?next=%2Fresults")
  await expect(page.getByText("Заявка отправлена")).toHaveCount(0)
})

test("route plan is protected for guests", async ({ page }) => {
  await page.goto("/routes/armenia-visa-free-180")

  await expect(page).toHaveURL(/\/auth\/login/)
  await expect(page).toHaveURL(/next=%2Froutes%2Farmenia-visa-free-180/)
  await expect(
    page.getByText("Войдите, чтобы открыть пошаговый план")
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Вход в Relogator" })
  ).toBeVisible()
})

test("signed in user can read and step through a route plan", async ({
  page,
}) => {
  test.setTimeout(60_000)
  const credentials = readE2ECredentials()

  test.skip(
    !credentials,
    "E2E_USER_EMAIL and E2E_USER_PASSWORD are required for authenticated route checks."
  )

  await page.goto("/auth/login?next=%2Froutes%2Farmenia-visa-free-180")
  await page.getByLabel("Email").fill(credentials!.email)
  await page.getByLabel("Пароль").fill(credentials!.password)
  await page.getByRole("button", { name: "Войти" }).click()
  await page.getByRole("button", { name: "Выйти" }).waitFor({
    state: "visible",
    timeout: 15_000,
  })
  await page.evaluate((profile) => {
    window.localStorage.setItem("relogator-profile", JSON.stringify(profile))
  }, routePlanProfile)
  await page.goto("/routes/armenia-visa-free-180")
  await expect(page).toHaveURL(/\/routes\/armenia-visa-free-180/)

  await expect(
    page.getByRole("heading", { name: "Пошаговый план" })
  ).toBeVisible()
  await expect(page.getByText("Что сделать сейчас")).toBeVisible()
  await expect(page.getByText("Контрольные точки")).toBeVisible()
  await expect(page.getByText("Персональная оценка")).toHaveCount(0)
  await expect(page.getByText("Оценка по вашей анкете")).toBeVisible()

  await page.getByRole("button", { name: "Далее" }).click()
  await expect(page.getByText("Шаг 2 из")).toBeVisible()

  await page.getByText("Оценка по вашей анкете").click()
  await expect(page.getByText("Почему подходит")).toBeVisible()

  await page.getByText("Источники").click()
  await expect(
    page.getByRole("complementary").getByRole("link").filter({
      hasText: "Официальная",
    })
  ).toBeVisible()
})

test("mobile layout has no horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/")

  const hasNoOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth
  )

  expect(hasNoOverflow).toBe(true)
})

test("auth pages render without sending real emails", async ({ page }) => {
  await page.goto("/auth/register")
  await expect(page.getByRole("heading", { name: "Регистрация" })).toBeVisible()
  await expect(page.getByLabel("Email")).toBeVisible()
  await expect(page.getByLabel("Пароль")).toBeVisible()
  await expect(
    page.getByLabel("Согласие с пользовательским соглашением")
  ).toBeVisible()
  await expect(
    page.getByLabel("Согласие на обработку персональных данных")
  ).toBeVisible()
  await expect(page.locator('form input[type="checkbox"]')).toHaveCount(2)

  await page.goto("/auth/login")
  await expect(
    page.getByRole("heading", { name: "Вход в Relogator" })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "Забыли пароль?" })).toBeVisible()

  await page.goto("/auth/reset-password")
  await expect(
    page.getByRole("heading", { name: "Сброс пароля" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Отправить письмо" })
  ).toBeVisible()

  await page.goto("/auth/new-password")
  await expect(
    page.getByRole("heading", { name: "Новый пароль" })
  ).toBeVisible()
  await expect(page.getByLabel("Повторите пароль")).toBeVisible()
  await expect(page.getByText(/sb_publishable|service_role/)).toHaveCount(0)
})

test("guest account page is action-oriented and not technical", async ({
  page,
}) => {
  await page.goto("/account")

  await expect(
    page.getByRole("heading", { name: "Личный кабинет" })
  ).toBeVisible()
  await expect(
    page.getByRole("main").getByRole("link", { name: "Начать подбор" })
  ).toBeVisible()
  await expect(page.getByText(/role: user|Роль: user|MVP/i)).toHaveCount(0)
})

test("specialist requests page is user-facing and not a technical export screen", async ({
  page,
}) => {
  await page.goto("/specialist-requests")

  await expect(
    page.getByRole("heading", { name: "Обращения к специалистам" })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "К маршрутам" })).toBeVisible()
  await expect(page.getByText(/JSON|CSV/)).toHaveCount(0)
  await expect(
    page.getByText(/Найдено|на этом устройстве|из этого браузера/i)
  ).toHaveCount(0)
})

test("partners page lets agencies submit an interest form", async ({
  page,
}) => {
  await page.route("**/api/partner-leads", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ saved: true }),
    })
  })

  await page.goto("/partners")

  await expect(
    page.getByRole("heading", {
      name: /Принимайте обращения от людей/i,
    })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Оставить заявку" })
  ).toBeVisible()
  await expect(page.locator('form input[type="checkbox"]')).toHaveCount(1)

  await page.getByRole("button", { name: "Отправить" }).click()
  await expect(
    page.getByText("Заполните обязательные поля и подтвердите согласие.")
  ).toBeVisible()
  await expect(
    page.getByText("Укажите компанию или имя специалиста.")
  ).toBeVisible()
  await expect(page.getByLabel("Компания или специалист")).toBeFocused()

  await page.getByLabel("Компания или специалист").fill("Relocation Helper")
  await page.getByLabel("Контактное лицо").fill("Иван")
  await page.getByLabel("Способ связи").fill("ivan@example.com")
  await page
    .getByLabel("Сайт или официальный канал")
    .fill("https://example.com")
  await page.getByLabel("Страны").fill("Сербия, Армения, Турция")
  await page.getByLabel("Чем помогаете").fill("Визы, ВНЖ, документы")
  await page
    .getByLabel("Комментарий")
    .fill("Хотим обсудить партнерство и обработку обращений клиентов.")
  await page.getByLabel("Согласие на обработку заявки партнера").click()
  await page.getByRole("button", { name: "Отправить" }).click()

  await expect(page.getByText("Заявка отправлена")).toBeVisible()
  await expect(page.getByText(/MVP/i)).toHaveCount(0)
})

test("quick exit scenario shows routes that can start now", async ({
  page,
}) => {
  await page.goto("/questionnaire")
  await fillQuestionnaire(page, {
    goal: "Уехать быстро",
    departure: "В течение 2 недель",
    stay: "1-3 месяца",
    passport: "Да, срок больше 18 месяцев",
    companions: ["Еду один"],
    income: "Нет или пока не уверен",
    incomeLevel: "Нет подтверждаемого дохода",
    savings: "Небольшой запас",
    translation: "Готов, если будет список",
  })

  await expect(
    page.getByRole("heading", { name: "Лучшие варианты" })
  ).toBeVisible()
})

test("residence, family and pet scenarios keep conditional explanations", async ({
  page,
}) => {
  await page.goto("/questionnaire")
  await fillQuestionnaire(page, {
    goal: "Переехать с семьей",
    departure: "В течение 3 месяцев",
    stay: "6-12 месяцев",
    passport: "Да, срок 6-18 месяцев",
    companions: ["С партнером", "С детьми", "С животными"],
    income: "Да, могу подтвердить",
    incomeLevel: "1000-3000 долларов/евро",
    savings: "Средний запас",
    financeChecks: ["Есть трудовой договор"],
    translation: "Нужна помощь специалиста",
    documentChecks: ["Нужна школа или сад"],
  })

  await expect(
    page.getByRole("heading", { name: "Менее подходящие" })
  ).toBeVisible()
  const showMoreWeakRoutes = page.getByRole("button", {
    name: "Показать все маршруты в разделе Менее подходящие",
  })
  if ((await showMoreWeakRoutes.count()) > 0) {
    await showMoreWeakRoutes.click()
    await expect(
      page.getByRole("button", { name: "Свернуть раздел Менее подходящие" })
    ).toBeVisible()
  }
  await expect(
    page.getByText("Можно планировать переезд с животным").first()
  ).toBeVisible()
  await expect(
    page.getByText("семейный сценарий с детьми").first()
  ).toBeVisible()
})

test("no passport and no income scenario shows blocked and unlock explanations", async ({
  page,
}) => {
  await page.goto("/questionnaire")
  await fillQuestionnaire(page, {
    goal: "Получить ВНЖ или временный статус",
    departure: "В течение 2 недель",
    stay: "Больше года",
    passport: "Нет",
    companions: ["Еду один"],
    income: "Нет или пока не уверен",
    incomeLevel: "Нет подтверждаемого дохода",
    savings: "Почти нет",
    translation: "Пока не готов",
  })

  await expect(
    page.getByRole("heading", { name: "Не подходят сейчас" })
  ).toBeVisible()
  await expect(
    page.getByText("Нет действующего загранпаспорта").first()
  ).toBeVisible()
  await page
    .getByRole("button", {
      name: "Показать все маршруты в разделе Не подходят сейчас",
    })
    .click()
  await expect(
    page.getByRole("button", { name: "Свернуть раздел Не подходят сейчас" })
  ).toBeVisible()
  await expect(
    page.getByText("Нужно подтвердить регулярный доход").first()
  ).toBeVisible()
})

type QuestionnaireScenario = {
  goal: string
  departure: string
  stay: string
  passport: string
  companions: string[]
  income: string
  incomeLevel: string
  savings: string
  financeChecks?: string[]
  translation: string
  documentChecks?: string[]
}

const routePlanProfile = {
  companions: ["alone"],
  departureWindow: "three_months",
  goal: "quick_exit",
  hasBusiness: false,
  hasCriminalRecordCertificate: false,
  hasEmploymentContract: false,
  hasProvableIncome: true,
  monthlyIncomeLevel: "one_to_three_thousand",
  needsBankAccount: false,
  needsSchool: false,
  passportStatus: "more_than_18_months",
  preparedDocuments: ["income_proof", "bank_statements"],
  savingsLevel: "medium",
  schengenHistory: "not_sure",
  stayDuration: "one_to_three_months",
  translationReadiness: "ready_with_list",
  valuesLowCost: false,
  valuesRussianSpeaking: true,
  valuesWarmClimate: false,
  visaHistory: "not_sure",
  visaIssues: [],
  willingToOpenCompany: false,
}

function choice(page: Page, id: string) {
  return page.locator(`[data-choice-id="${id}"]`)
}

async function expectChoiceChecked(page: Page, id: string) {
  await expect(choice(page, id)).toHaveAttribute("aria-checked", "true")
}

async function expectChoiceUnchecked(page: Page, id: string) {
  await expect(choice(page, id)).toHaveAttribute("aria-checked", "false")
}

function readE2ECredentials() {
  const env = {
    E2E_USER_EMAIL: process.env.E2E_USER_EMAIL,
    E2E_USER_PASSWORD: process.env.E2E_USER_PASSWORD,
    ...readDotenvFile(),
  }
  const email = env.E2E_USER_EMAIL?.trim()
  const password = env.E2E_USER_PASSWORD?.trim()

  if (!email || !password) {
    return null
  }

  return { email, password }
}

function readDotenvFile() {
  if (!existsSync(".env")) {
    return {}
  }

  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([^#][^=]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1].trim(), match[2].trim()])
  ) as Record<string, string>
}

async function fillQuestionnaire(page: Page, scenario: QuestionnaireScenario) {
  await page.getByText(scenario.goal, { exact: true }).click()
  await page.getByRole("button", { name: /Дальше/ }).click()

  await page.getByText(scenario.departure, { exact: true }).click()
  await page.getByText(scenario.stay, { exact: true }).click()
  await page.getByText(scenario.passport, { exact: true }).click()
  await page.getByRole("button", { name: /Дальше/ }).click()

  for (const companion of scenario.companions) {
    await page.getByText(companion, { exact: true }).click()
  }
  await page.getByRole("button", { name: /Дальше/ }).click()

  await page.getByText(scenario.income, { exact: true }).click()
  await page.getByText(scenario.incomeLevel, { exact: true }).click()
  await page.getByText(scenario.savings, { exact: true }).click()
  for (const check of scenario.financeChecks ?? []) {
    await page.getByText(check, { exact: true }).click()
  }
  await page.getByRole("button", { name: /Дальше/ }).click()

  await page.getByText(scenario.translation, { exact: true }).click()
  for (const check of scenario.documentChecks ?? []) {
    await page.getByText(check, { exact: true }).click()
  }
  await page.getByRole("button", { name: /Дальше/ }).click()

  const submitButton = page.getByRole("button", { name: "Показать маршруты" })
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()
  await submitButton.click()
  await page.waitForURL(/\/results/, { timeout: 10_000 })
}
