# Промт разработчику: инфраструктура производственных графов Relogator

Работай в `D:\WORKHARD\Dev\Shevchuk`.

Сначала прочитай:

- `AGENTS.md`;
- `DATA_PIPELINE.md`;
- `PLANS.md`;
- `docs/research/relocation-route-atlas-2026-06-20.md`;
- `docs/research/deepseek-production-graph-wave-2026-06-20.md`;
- текущие `data/catalog.json`, `data/countries/*.json`, `data/routes/*.json`, `data/sources/*.json`.

## Контекст

Сборщики данных будут создавать производственные черновики графов в:

```text
data/drafts/production-graphs/*.json
```

Эти файлы не должны сразу попадать в публичную выдачу. Их нужно отдельно валидировать, проверять и только потом импортировать в `data/routes`, `data/sources`, `data/requirements`, `data/documents` или будущую базу.

## Цель

Добавить инфраструктуру для графов:

`источник -> правовой факт -> условие -> документ -> маршрут -> шаг -> правило оценки -> персональный вывод`

При этом основной пользовательский путь остается без обязательного ИИ.

## Что сделать

1. Добавить Zod-схемы для черновиков графа:

   - `GraphDraft`;
   - `GraphCountry`;
   - `GraphSourceNode`;
   - `GraphLegalFactNode`;
   - `GraphRequirementNode`;
   - `GraphRouteNode`;
   - `GraphPersonalizationRule`;
   - `GraphReviewLogEntry`.

2. Добавить папку:

   ```text
   data/drafts/production-graphs/
   ```

   Если в репозитории нельзя хранить пустую папку, добавь `.gitkeep`.

3. Добавить npm-скрипт:

   ```json
   "validate:graphs": "node scripts/validate-production-graphs.mjs"
   ```

4. Добавить `scripts/validate-production-graphs.mjs`, который:

   - читает все `data/drafts/production-graphs/*.json`;
   - валидирует схему;
   - проверяет уникальность id внутри файла;
   - проверяет ссылки `sourceIds`, `legalFactIds`, `requirementIds`, `routeIds`;
   - проверяет, что все публично значимые утверждения имеют источник или явный `source_needed`;
   - запрещает `publicationStatusSuggestion: reviewed`, если есть `source_needed`;
   - запрещает слова вроде `гарантированно`, `точно одобрят`, `100%`, `без отказа`;
   - пишет понятный отчет по ошибкам.

5. Добавить отчетный npm-скрипт:

   ```json
   "report:graphs": "node scripts/report-production-graphs.mjs"
   ```

   Он должен показывать:

   - сколько стран покрыто;
   - сколько источников official/source_needed;
   - сколько маршрутов по статусам;
   - сколько manual review вопросов;
   - какие страны еще отсутствуют.

6. Расширить модель маршрутов или подготовить слой преобразования:

   - `routeType`: `short_entry`, `medium_stay`, `residence`, `remote_work`, `local_work`, `business`, `family`, `study`, `pets`;
   - `entryCountries`;
   - `exitCountries`;
   - `transitRisks`;
   - `legalFactIds`;
   - `requirementIds`;
   - `personalizationRuleIds`;
   - `manualReviewQuestions`.

   Не обязательно сразу менять публичную выдачу. Можно сделать отдельный доменный слой `src/domain/production-graph-*`.

7. Добавить тесты:

   - граф с `source_needed` не может быть `reviewed`;
   - route не может ссылаться на неизвестный source/legalFact/requirement;
   - страны из `data/catalog.json` должны быть покрыты либо публичными `data/*`, либо графовыми черновиками;
   - запрещенные юридические обещания ловятся валидатором.

8. Не трогать авторизацию, UI и Supabase в этой задаче.

## Ограничения

- Не читать и не печатать `.env`.
- Не добавлять внешние зависимости без необходимости.
- Не переносить DeepSeek-черновики в публичный `reviewed` статус автоматически.
- Не смешивать официальные факты и редакционные выводы.
- Не ломать существующие проверки:

  ```powershell
  npm run validate:data
  npm run validate:graphs
  npm run typecheck
  npm run lint
  npm test -- --run
  npm run build
  npm run e2e
  ```

## Что считать готовым

- В проекте есть валидатор графов.
- Агенты могут писать `data/drafts/production-graphs/*.json`, а проект может проверить эти файлы.
- Ошибки источников, ссылок и юридических обещаний ловятся автоматически.
- Публичная выдача не начинает показывать непроверенные графы как проверенные маршруты.
