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

  await expect(page.locator("#goal-quick_exit")).toHaveAttribute(
    "aria-checked",
    "true"
  )
  await expect(page.locator("#goal-compare")).toHaveAttribute(
    "aria-checked",
    "false"
  )

  await page.getByText("Пока сравниваю варианты", { exact: true }).click()

  await expect(page.locator("#goal-quick_exit")).toHaveAttribute(
    "aria-checked",
    "false"
  )
  await expect(page.locator("#goal-compare")).toHaveAttribute(
    "aria-checked",
    "true"
  )

  await page.getByText("Уехать быстро", { exact: true }).click()

  await expect(page.locator("#goal-quick_exit")).toHaveAttribute(
    "aria-checked",
    "true"
  )
  await expect(page.locator("#goal-compare")).toHaveAttribute(
    "aria-checked",
    "false"
  )
})

test("empty questionnaire step cannot be skipped", async ({ page }) => {
  await page.goto("/questionnaire")
  await page.getByRole("button", { name: /Дальше/ }).click()

  await expect(page.getByText("Выберите задачу переезда.")).toBeVisible()
  await expect(
    page.getByText("Шаг 1 из 6: Цель", { exact: true })
  ).toBeVisible()
})

test("user can complete questionnaire, request help and see protected route plan", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", {
      name: /Спокойный план переезда вместо десятков вкладок и слухов/i,
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
  await expect(
    page.locator("h2").filter({ hasText: "Что улучшит подбор" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Наиболее подходящие маршруты" }).first()
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Почему подходит" }).first()
  ).toBeVisible()

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
  await page.getByRole("button", { name: "Сохранить заявку" }).click()
  await expect(page.getByText("Заявка сохранена")).toBeVisible()
  await page.getByRole("link", { name: "Открыть список заявок" }).click()
  await expect(page).toHaveURL(/\/specialist-requests/)
  await expect(page.getByText("Ваши заявки специалистам")).toBeVisible()
  await expect(page.getByText("Анна")).toBeVisible()
  await expect(page.getByRole("button", { name: "Скачать JSON" })).toBeEnabled()
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
    page.getByRole("heading", { name: "Наиболее подходящие маршруты" })
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
    page.getByText("Оформить или заменить загранпаспорт").first()
  ).toBeVisible()
  await expect(page.getByText("Если подтвердить доход").first()).toBeVisible()
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
