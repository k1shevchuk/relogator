# Relogator: волна построения производственных графов через DeepSeek

Дата: 2026-06-20.

Назначение: дать агентам единый протокол, чтобы превратить черновой атлас маршрутов в проверяемые производственные графы стран, маршрутов, условий, источников, законов, документов, блокеров и правил персонализации.

Важно: DeepSeek используется как рабочий аналитик и редактор, но не как источник истины. Агент обязан проверять вывод DeepSeek по официальным источникам, просить модель исправлять слабые места и помечать непроверенные факты как `needs_review`, `stale` или `reference_only`.

## Что сейчас есть

- Черновой атлас: `docs/research/relocation-route-atlas-2026-06-20.md`.
- Текущие данные по 20 странам: `data/countries/*.json`, `data/routes/*.json`, `data/sources/*.json`.
- Целевой список 34 стран: `data/catalog.json`.
- Временный вызов OpenRouter: `C:\Users\kirill\.codex\skills\openrouter-delegate\scripts\openrouter_call.py`.
- Ключ лежит в `.env` как `OPENROUTER_API_KEY`; его нельзя печатать, логировать или копировать в файлы.

## Главная цель волны

Для каждой страны построить граф:

`официальный источник -> правовой факт -> условие применимости -> этап -> переход -> документ -> маршрутный план -> правило оценки -> персональный вывод`

Граф должен учитывать:

- гражданство РФ;
- страну текущего пребывания пользователя, если она влияет на подачу;
- страну въезда;
- страну выезда;
- транзитные ограничения;
- внешние правила: Шенген, ЕС, ЕАЭС, авиаперевозчик, страна подачи;
- внутренние правила целевой страны: въезд, пребывание, работа, ВНЖ, семья, учеба, бизнес, животные;
- исключения, ограничения, санкционные/политические риски;
- дату проверки и уверенность.
- законные последовательности действий для долгого пребывания: въезд, разрешенный срок, продление, выезд и новый въезд там, где это подтверждено источником, смена основания, подача на статус, ожидание решения и запасной план.

## Что агент должен делать

Агент не должен просто принять первый ответ DeepSeek. Минимальный цикл:

1. Сформулировать задачу DeepSeek по группе стран.
2. Получить первичный граф.
3. Проверить источники: открыть официальные страницы, найти противоречия, устаревшие факты и недоказанные утверждения.
4. Составить список претензий к ответу DeepSeek.
5. Отправить DeepSeek второй запрос: исправить граф с учетом претензий, не выдумывать недостающие факты.
6. Повторить, пока грубые ошибки не сняты или пока все спорные пункты не помечены `needs_review`.
7. Сохранить результат в отдельный файл черновика, не трогая публичные `data/routes/*.json`.

## Куда сохранять результат

Каждый агент пишет только в свой файл:

```text
data/drafts/production-graphs/graph-a-caucasus-balkans.json
data/drafts/production-graphs/graph-b-asia-central-asia.json
data/drafts/production-graphs/graph-c-middle-east-americas.json
data/drafts/production-graphs/graph-d-europe-schengen.json
```

Если папки нет, агент создает ее.

## Общий JSON-формат

```json
{
  "meta": {
    "agent": "graph-a-caucasus-balkans",
    "createdAt": "2026-06-20",
    "model": "deepseek/deepseek-v4-pro",
    "status": "draft",
    "scopeCountries": ["GE", "AM"],
    "limitations": []
  },
  "countries": [
    {
      "countryCode": "GE",
      "countryNameRu": "Грузия",
      "graphStatus": "needs_review",
      "jurisdictions": [
        {
          "id": "GE",
          "type": "target_country",
          "name": "Грузия",
          "notes": []
        }
      ],
      "sourceNodes": [
        {
          "id": "georgia-official-example",
          "title": "Official page title",
          "url": "https://...",
          "sourceType": "official_body",
          "jurisdiction": "GE",
          "language": "en",
          "lastCheckedAt": "2026-06-20",
          "appliesToCitizenship": ["RU"],
          "confidence": "high",
          "officialness": "official",
          "quoteOrFact": "Краткий пересказ факта без длинной цитаты"
        }
      ],
      "legalFactNodes": [
        {
          "id": "georgia-entry-ru-visa-free",
          "sourceIds": ["georgia-official-example"],
          "factType": "entry|stay|residence|work|business|family|study|pets|tax|banking|exit|transit",
          "fact": "Краткий проверяемый факт",
          "appliesWhen": [
            {
              "field": "citizenship",
              "operator": "equals",
              "value": "RU"
            }
          ],
          "exceptions": [],
          "needsManualReview": false,
          "confidence": "high"
        }
      ],
      "requirementNodes": [
        {
          "id": "passport-min-months",
          "title": "Минимальный срок паспорта",
          "sourceIds": [],
          "appliesWhen": [],
          "documents": [],
          "hardBlockerWhenMissing": true,
          "affects": ["documents", "approvalRisk"],
          "confidence": "medium"
        }
      ],
      "routeNodes": [
        {
          "id": "georgia-short-entry-ru",
          "title": "Короткий въезд",
          "routeType": "short_entry|medium_stay|residence|remote_work|local_work|business|family|study|pets",
          "goals": ["quick_exit", "medium_stay"],
          "stayDurations": ["one_to_three_months"],
          "entryCountries": ["RU", "AM", "TR", "RS", "source_needed"],
          "exitCountries": ["GE", "source_needed"],
          "transitRisks": [],
          "sourceIds": [],
          "legalFactIds": [],
          "requirementIds": [],
          "documents": [],
          "steps": [],
          "blockers": [],
          "unlocks": [],
          "difficulty": {
            "documents": 2,
            "cost": 2,
            "approvalRisk": 2,
            "speed": 1,
            "adaptation": 2
          },
          "publicationStatusSuggestion": "needs_review",
          "confidence": "medium"
        }
      ],
      "stageNodes": [
        {
          "id": "georgia-short-entry-stage",
          "routeId": "georgia-short-entry-ru",
          "stageType": "prepare|entry|registration|short_stay|extension|status_application|waiting_decision|maintain_status|exit",
          "title": "Название этапа",
          "description": "Что законно происходит на этом этапе",
          "legalFactIds": [],
          "sourceIds": [],
          "deadlineIds": [],
          "publicationStatusSuggestion": "needs_review",
          "confidence": "medium"
        }
      ],
      "transitionEdges": [
        {
          "id": "georgia-short-entry-to-extension",
          "routeId": "georgia-short-entry-ru",
          "fromStageId": "georgia-short-entry-stage",
          "toStageId": "georgia-extension-stage",
          "transitionType": "extend|apply_status|change_basis|exit_and_reenter|switch_to_work|switch_to_study|switch_to_family|finish_route",
          "conditions": [],
          "legalActions": [],
          "deadlineIds": [],
          "fallbackPlanIds": [],
          "sourceIds": [],
          "needsManualReview": true,
          "confidence": "low"
        }
      ],
      "deadlineNodes": [
        {
          "id": "georgia-extension-deadline",
          "title": "Когда начать следующий шаг",
          "rule": "Краткое правило или source_needed",
          "bufferRecommendation": "Редакционная рекомендация или source_needed",
          "sourceIds": [],
          "confidence": "low"
        }
      ],
      "fallbackPlans": [
        {
          "id": "georgia-extension-fallback",
          "title": "Что делать, если переход не сработал",
          "actions": [],
          "risks": [],
          "sourceIds": [],
          "needsSpecialistReview": true
        }
      ],
      "personalizationRules": [
        {
          "id": "if-no-passport-block",
          "routeIds": [],
          "if": [
            {
              "field": "passportStatus",
              "operator": "equals",
              "value": "none"
            }
          ],
          "then": {
            "availability": "blocked",
            "blockers": ["Нет действующего загранпаспорта."],
            "unlocks": ["Оформить загранпаспорт."],
            "difficultyDelta": {
              "documents": 2,
              "approvalRisk": 2
            }
          },
          "sourceIds": []
        }
      ],
      "reviewLog": [
        {
          "round": 1,
          "issue": "DeepSeek указал факт без официального источника",
          "action": "Запрошено исправление; факт помечен source_needed"
        }
      ],
      "manualReviewQuestions": []
    }
  ]
}
```

## Команда для DeepSeek

Перед вызовом не печатать ключ. В PowerShell:

```powershell
$ErrorActionPreference='Stop'
foreach ($line in Get-Content -LiteralPath .env) {
  if ($line -match '^\s*OPENROUTER_API_KEY\s*=\s*(.+?)\s*$') {
    $value = $Matches[1].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $env:OPENROUTER_API_KEY = $value
  }
}
python C:\Users\kirill\.codex\skills\openrouter-delegate\scripts\openrouter_call.py --model deepseek/deepseek-v4-pro --max-tokens 12000 --temperature 0.1 --prompt-file path\to\prompt.txt
```

Если большой ответ обрывается, делить запрос на 1-2 страны.

## Первый запрос DeepSeek

```text
Ты работаешь как беспристрастный миграционный аналитик для продукта Relogator.

Нужно построить проверяемый граф для стран: <COUNTRIES>.

Контекст:
- Пользователь — гражданин РФ, но может находиться не только в РФ.
- Страна не первый фильтр: сначала анкета, затем подбор маршрута.
- Продукт не дает юридическую консультацию.
- Нельзя обещать одобрение визы, ВНЖ или въезда.
- Каждый факт должен иметь официальный источник или пометку source_needed.

Используй структуру JSON из docs/research/deepseek-production-graph-wave-2026-06-20.md.

Обязательно покрой ветки:
- short_entry;
- medium_stay;
- residence;
- remote_work;
- local_work;
- business;
- family;
- study;
- pets.

Для каждой ветки обязательно опиши:
- стартовый этап;
- максимальный или ориентировочный срок первичного пребывания, если он есть в источнике;
- законные переходы к следующему этапу;
- что нужно сделать до дедлайна;
- что делать, если переход невозможен, отказан или не подтвержден источником;
- где нужна ручная проверка.

Для каждой страны учти:
- внутренние правила целевой страны;
- внешние правила: Шенген/ЕС/ЕАЭС/страна подачи/страна въезда/страна выезда/транзит;
- применимость именно к гражданам РФ;
- если правило зависит от места подачи, так и запиши;
- если данные не найдены, не выдумывай, поставь source_needed и needs_review.

Верни только JSON.
```

## Запрос на критику ответа DeepSeek

После первого ответа агент должен открыть источники и составить список претензий. Затем отправить:

```text
Ты дал черновой граф. Я проверил источники и нашел проблемы:

<ISSUES>

Исправь граф:
- удали или пометь needs_review все недоказанные утверждения;
- отдели официальный факт от редакционного вывода;
- добавь source_needed, если нет официального источника;
- не обещай одобрение;
- уточни страну подачи, страну въезда, страну выезда и транзит, если они влияют на маршрут;
- сохрани JSON-структуру.

Верни только исправленный JSON.
```

## Критерии брака

Ответ DeepSeek нельзя принимать, если:

- есть точный срок, сумма или правило без официального источника;
- блог или агентство использованы как главный источник вместо госоргана;
- маршрут говорит "можно", но не указано основание;
- смешаны туристический въезд, право жить и право работать;
- не разделены иностранный работодатель и местный работодатель;
- по Шенгену не учтены ограничения для граждан РФ;
- по ЕАЭС не разделены въезд, регистрация, работа и ВНЖ;
- для семьи не указано, чей статус является основным;
- для животных нет отдельной ветки;
- нет `manualReviewQuestions`.

## Группы агентов

### Агент A

Файл: `data/drafts/production-graphs/graph-a-caucasus-balkans.json`

Страны:

- GE Грузия;
- AM Армения;
- RS Сербия;
- TR Турция;
- ME Черногория.

Фокус:

- безвизовые режимы;
- местная работа и право на работу;
- ИП/компания;
- ВНЖ/temporary residence;
- семья, школа, питомцы;
- страна въезда и выезда через соседние страны.

### Агент B

Файл: `data/drafts/production-graphs/graph-b-asia-central-asia.json`

Страны:

- KZ Казахстан;
- KG Кыргызстан;
- UZ Узбекистан;
- VN Вьетнам;
- TH Таиланд;
- ID Индонезия.

Фокус:

- ЕАЭС;
- регистрация/адрес;
- digital nomad и удаленная работа;
- e-visa, visitor visa, e-VOA;
- местная работа и work permit;
- животные и карантин.

### Агент C

Файл: `data/drafts/production-graphs/graph-c-middle-east-americas.json`

Страны:

- AE ОАЭ;
- CY Кипр;
- IL Израиль;
- BR Бразилия;
- MX Мексика;
- AR Аргентина.

Фокус:

- remote work / digital nomad;
- репатриация Израиль;
- временное проживание по доходу;
- family routes;
- въезд по воздуху/ETA/SAE;
- инвестиционные и бизнес-ветки.

### Агент D

Файл: `data/drafts/production-graphs/graph-d-europe-schengen.json`

Страны:

- ES Испания;
- PT Португалия;
- DE Германия;
- FR Франция;
- PL Польша;
- BG Болгария;
- HU Венгрия;
- IT Италия;
- AT Австрия;
- NL Нидерланды;
- FI Финляндия;
- CZ Чехия;
- CH Швейцария;
- LT Литва;
- LV Латвия;
- GR Греция;
- SE Швеция.

Фокус:

- Шенген C;
- национальная виза D;
- санкционные/пограничные ограничения для граждан РФ;
- work/Blue Card/highly skilled;
- self-employment;
- digital nomad где есть;
- family/study/pets.

## Что вернуть в финальном отчете агента

Агент должен написать:

- какие файлы созданы;
- сколько стран обработано;
- сколько источников официальные;
- сколько фактов `source_needed`;
- какие маршруты нельзя публиковать;
- какие вопросы требуют ручной проверки человеком или партнером;
- сколько раз DeepSeek был отправлен на исправление и почему.
