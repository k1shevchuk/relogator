# Higgsfield: настройка и использование для Relogator

Дата настройки: 2026-06-18.

## Что установлено

1. Глобальный CLI:

```powershell
npm install -g @higgsfield/cli
```

Проверка:

```powershell
higgsfield version
```

На момент настройки установлена версия `0.2.2`.

2. MCP-сервер Codex:

```powershell
codex -c service_tier='"fast"' mcp add higgsfield --url https://mcp.higgsfield.ai/mcp
codex -c service_tier='"fast"' mcp login higgsfield
```

Проверка:

```powershell
codex -c service_tier='"fast"' mcp list
```

Ожидаемое состояние для `higgsfield`: `enabled`, `Auth = OAuth`.

Примечание: `-c service_tier='"fast"'` нужен из-за текущей строки `service_tier = "default"` в пользовательском `C:\Users\kirill\.codex\config.toml`. Текущая версия `codex mcp` ожидает `fast` или `flex`.

3. Навыки Higgsfield:

```powershell
npx skills add higgsfield-ai/skills
```

Установщик положил копии в проект:

- `.agents/skills/higgsfield-generate`
- `.agents/skills/higgsfield-marketplace-cards`
- `.agents/skills/higgsfield-product-photoshoot`
- `.agents/skills/higgsfield-soul-id`

Также они скопированы глобально в:

- `C:\Users\kirill\.codex\skills\higgsfield-generate`
- `C:\Users\kirill\.codex\skills\higgsfield-marketplace-cards`
- `C:\Users\kirill\.codex\skills\higgsfield-product-photoshoot`
- `C:\Users\kirill\.codex\skills\higgsfield-soul-id`

## Авторизация

CLI авторизован через:

```powershell
higgsfield auth login
```

Не печатать токены командой:

```powershell
higgsfield auth token
```

Проверка аккаунта без вывода почты:

```powershell
higgsfield account status --json
```

На момент проверки был бесплатный план и 9.76 кредитов после двух пробных попыток генерации.

## Пробная генерация

Команда, которая сработала:

```powershell
higgsfield generate create text2image_soul_v2 `
  --aspect_ratio 16:9 `
  --quality 1.5k `
  --prompt "Clean trustworthy product design concept for Relogator, relocation document navigator web app. Realistic interface mockup with step-by-step questionnaire, route cards, document readiness scales, official source badges, specialist consultation entry point. Calm light SaaS style, slate text, restrained blue accent, no marketing hero, no decorative blobs, no purple gradients, no emojis." `
  --wait `
  --wait-timeout 5m `
  --wait-interval 5s `
  --json
```

Результат сохранен локально:

`docs/design/higgsfield-relogator-concept-2026-06-18.png`

Вывод по качеству: картинка технически сгенерировалась, но как эталон интерфейса слабая. В ней есть бессмысленный псевдотекст и лишний визуальный шум. Использовать ее только как подтверждение, что связка работает, а не как дизайн для реализации.

## Обнаруженные ограничения

1. Higgsfield хорошо подходит для визуальных референсов, рекламных изображений, обложек, промо-материалов и концептов.
2. Для продуктового интерфейса Relogator он не должен заменять проектирование экранов, сеток, состояний форм, доступности и пользовательских сценариев.
3. Текст внутри сгенерированных картинок ненадежен. Для интерфейсных референсов лучше просить `no readable text, abstract text lines only`.
4. Некоторые команды CLI периодически падали на обращении к `https://fnf.higgsfield.ai/agents/models` или `jobs/...`. Повтор команды может сработать.
5. Перед генерацией желательно считать стоимость:

```powershell
higgsfield generate cost text2image_soul_v2 --aspect_ratio 16:9 --quality 1.5k --prompt "..."
```

## Рекомендуемый запрос для следующей генерации

```text
High fidelity web app UI reference for Relogator, a relocation document navigator.
Show a realistic desktop SaaS interface, not a marketing landing page.
Use abstract text lines only, no readable fake text.
Layout: left questionnaire progress and current question, center route recommendations grouped by availability, right side document readiness and source verification panel.
Include visual indicators for documents, cost, preparation time, risk of refusal or additional request, and adaptation.
Style: calm, trustworthy, utilitarian, light background, slate text, restrained blue accent, subtle borders, compact information density, no people, no photos, no decorative blobs, no purple gradients, no emojis.
```

## Как использовать разработчику

Higgsfield-референс можно использовать только как визуальную подсказку. Реальный интерфейс строить по правилам проекта:

- Next.js;
- TypeScript;
- shadcn/ui;
- Radix UI;
- Tailwind CSS;
- Lucide React;
- доступные формы;
- без декоративного рекламного стиля;
- без карточек внутри карточек;
- без предвыбранных ответов анкеты.
