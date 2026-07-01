"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import type { PathValue } from "react-hook-form"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Save } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  defaultQuestionnaireDraft,
  finalizeQuestionnaireDraft,
  validateQuestionnaireStep,
} from "@/domain/questionnaire"
import {
  buildLiveQuestionnaireHints,
  calculateProfileReadiness,
  type ReadinessTone,
} from "@/domain/questionnaire-readiness"
import type {
  Companion,
  PreparedDocument,
  QuestionnaireDraft,
  VisaIssue,
} from "@/domain/types"
import { summarizeProfile } from "@/features/questionnaire/profile-labels"
import {
  companionOptions,
  departureOptions,
  goalOptions,
  incomeOptions,
  passportOptions,
  preparedDocumentOptions,
  profileStorageKey,
  questionnaireDraftSchema,
  questionnaireDraftStorageKey,
  savingsOptions,
  schengenHistoryOptions,
  stayOptions,
  translationReadinessOptions,
  userProfileSchema,
  visaHistoryOptions,
  visaIssueOptions,
} from "./profile-schema"
import { saveQuestionnaireToServer } from "@/features/user-data/client"
import { cn } from "@/lib/utils"

const steps = [
  "Цель",
  "Сроки",
  "Состав",
  "Финансы",
  "Документы",
  "Проверка",
] as const

export function QuestionnaireFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [stepError, setStepError] = useState<string | null>(null)
  const draftLoadedRef = useRef(false)

  const form = useForm<QuestionnaireDraft>({
    resolver: zodResolver(questionnaireDraftSchema),
    defaultValues: defaultQuestionnaireDraft,
    mode: "onSubmit",
  })

  const { control, formState, reset, setValue } = form
  const values = useWatch({ control }) as QuestionnaireDraft

  useEffect(() => {
    const raw = window.localStorage.getItem(questionnaireDraftStorageKey)

    if (raw) {
      const parsed = safelyParseDraft(raw)

      if (parsed.success) {
        reset(parsed.data)
      }
    }

    draftLoadedRef.current = true
  }, [reset])

  useEffect(() => {
    if (draftLoadedRef.current) {
      window.localStorage.setItem(
        questionnaireDraftStorageKey,
        JSON.stringify(values)
      )
    }
  }, [values])

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step])
  const readiness = useMemo(() => calculateProfileReadiness(values), [values])
  const readinessHints = useMemo(
    () => buildLiveQuestionnaireHints(values).slice(0, 2),
    [values]
  )

  function nextStep() {
    const validation = validateQuestionnaireStep(step, values)

    if (!validation.success) {
      setStepError(validation.message ?? "Заполните обязательные ответы.")
      return
    }

    setStepError(null)
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function toggleCompanion(value: Companion) {
    const current = values.companions ?? []

    if (current.includes(value)) {
      setValue(
        "companions",
        current.filter((item) => item !== value),
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      )
      return
    }

    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current.filter((item) => item !== "alone"), value]

    setValue("companions", value === "alone" ? ["alone"] : next, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function toggleVisaIssue(value: VisaIssue) {
    const current = values.visaIssues ?? []
    const next: VisaIssue[] = current.includes(value)
      ? current.filter((item) => item !== value)
      : value === "not_sure"
        ? ["not_sure"]
        : [...current.filter((item) => item !== "not_sure"), value]

    setValue("visaIssues", next, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function togglePreparedDocument(value: PreparedDocument) {
    const current = values.preparedDocuments ?? []
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]

    setValue("preparedDocuments", next, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function saveProfileForResults() {
    const result = finalizeQuestionnaireDraft(values)

    if (!result.success) {
      setStep(result.firstInvalidStep)
      setStepError(result.message)
      return
    }

    const parsed = userProfileSchema.safeParse(result.data)

    if (!parsed.success) {
      setStepError("Не удалось подготовить анкету к расчету.")
      return
    }

    window.localStorage.setItem(profileStorageKey, JSON.stringify(parsed.data))
    void saveQuestionnaireToServer(parsed.data)
    router.push("/results")
  }

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="mx-auto flex w-full max-w-3xl flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Шаг {step + 1} из {steps.length}: {steps[step]}
          </span>
          <span className="flex items-center gap-1">
            <Save data-icon="inline-start" />
            Черновик сохраняется
          </span>
        </div>
        <Progress value={progress} aria-label="Прогресс анкеты" />
      </div>

      <ReadinessPanel
        score={readiness.score}
        label={readiness.label}
        description={readiness.description}
        hints={readinessHints}
      />

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{getStepTitle(step)}</CardTitle>
          <CardDescription>{getStepDescription(step)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {stepError && (
            <Alert variant="destructive">
              <AlertTitle>Нужно заполнить ответ</AlertTitle>
              <AlertDescription>{stepError}</AlertDescription>
            </Alert>
          )}

          {step === 0 && (
            <Controller
              control={control}
              name="goal"
              render={({ field }) => (
                <div role="radiogroup" className="grid gap-3">
                  {goalOptions.map((option) => {
                    return (
                      <Choice
                        key={option.value}
                        id={`goal-${option.value}`}
                        name="goal"
                        value={option.value}
                        checked={field.value === option.value}
                        label={option.label}
                        hint={option.hint}
                        onSelect={() =>
                          setValue("goal", option.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    )
                  })}
                </div>
              )}
            />
          )}

          {step === 1 && (
            <div className="grid gap-6 md:grid-cols-3">
              <RadioField
                control={control}
                name="departureWindow"
                label="Когда нужно уехать?"
                options={departureOptions}
                setValue={setValue}
              />
              <RadioField
                control={control}
                name="stayDuration"
                label="На какой срок?"
                options={stayOptions}
                setValue={setValue}
              />
              <RadioField
                control={control}
                name="passportStatus"
                label="Есть действующий загранпаспорт?"
                options={passportOptions}
                setValue={setValue}
              />
            </div>
          )}

          {step === 2 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium">
                Едете один или с кем-то?
              </legend>
              {companionOptions.map((option) => (
                <ToggleChoice
                  key={option.value}
                  checked={(values.companions ?? []).includes(option.value)}
                  label={option.label}
                  onToggle={() => toggleCompanion(option.value)}
                />
              ))}
              {formState.errors.companions && (
                <p className="text-sm text-destructive">
                  {formState.errors.companions.message}
                </p>
              )}
            </fieldset>
          )}

          {step === 3 && (
            <div className="grid gap-6 md:grid-cols-2">
              <BooleanRadioField
                control={control}
                name="hasProvableIncome"
                label="Есть подтверждаемый регулярный доход?"
                setValue={setValue}
              />
              <RadioField
                control={control}
                name="monthlyIncomeLevel"
                label="Какой доход можно подтвердить?"
                options={incomeOptions}
                setValue={setValue}
              />
              <RadioField
                control={control}
                name="savingsLevel"
                label="Есть ли накопления?"
                options={savingsOptions}
                setValue={setValue}
              />
              <BooleanField
                control={control}
                name="hasEmploymentContract"
                label="Есть трудовой договор"
              />
              <BooleanField
                control={control}
                name="hasBusiness"
                label="Есть ИП или ООО"
              />
              <BooleanField
                control={control}
                name="willingToOpenCompany"
                label="Готов открыть компанию за рубежом"
              />
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div className="rounded-md border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                Переводы, нотариальные копии и апостиль нужны, когда документы
                из РФ должны быть приняты органом другой страны.
              </div>
              <RadioField
                control={control}
                name="translationReadiness"
                label="Если маршрут потребует перевести или заверить документы, какой вариант ближе?"
                options={translationReadinessOptions}
                setValue={setValue}
              />
              <div className="grid gap-6 md:grid-cols-2">
                <RadioField
                  control={control}
                  name="visaHistory"
                  label="Какая визовая история у вас уже есть?"
                  options={visaHistoryOptions}
                  setValue={setValue}
                />
                <RadioField
                  control={control}
                  name="schengenHistory"
                  label="Есть ли действующий или недавний шенген?"
                  options={schengenHistoryOptions}
                  setValue={setValue}
                />
              </div>
              <fieldset className="flex flex-col gap-3">
                <legend className="text-sm font-medium">
                  Были ли сложные визовые ситуации?
                </legend>
                <p className="text-sm leading-6 text-muted-foreground">
                  Это не закрывает маршрут автоматически, но помогает заранее
                  отметить места, где нужна ручная проверка.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {visaIssueOptions.map((option) => (
                    <CheckboxChoice
                      key={option.value}
                      checked={(values.visaIssues ?? []).includes(option.value)}
                      label={option.label}
                      onToggle={() => toggleVisaIssue(option.value)}
                    />
                  ))}
                </div>
              </fieldset>
              <fieldset className="flex flex-col gap-3">
                <legend className="text-sm font-medium">
                  Какие документы уже есть или легко подготовить?
                </legend>
                <div className="grid gap-3 md:grid-cols-2">
                  {preparedDocumentOptions.map((option) => (
                    <CheckboxChoice
                      key={option.value}
                      checked={(values.preparedDocuments ?? []).includes(
                        option.value
                      )}
                      label={option.label}
                      onToggle={() => togglePreparedDocument(option.value)}
                    />
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 md:grid-cols-2">
                <BooleanField
                  control={control}
                  name="hasCriminalRecordCertificate"
                  label="Есть справка о несудимости"
                />
                <BooleanField
                  control={control}
                  name="needsSchool"
                  label="Нужна школа или сад"
                />
                <BooleanField
                  control={control}
                  name="needsBankAccount"
                  label="Нужен банковский счет"
                />
                <BooleanField
                  control={control}
                  name="valuesRussianSpeaking"
                  label="Важна русскоязычная среда"
                />
                <BooleanField
                  control={control}
                  name="valuesLowCost"
                  label="Важна низкая стоимость жизни"
                />
                <BooleanField
                  control={control}
                  name="valuesWarmClimate"
                  label="Важен теплый климат"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <Alert>
                <CheckCircle2 data-icon="inline-start" />
                <AlertTitle>Анкета готова к расчету</AlertTitle>
                <AlertDescription>
                  Расчет выполнится по структурированным правилам и официальным
                  источникам. Визовая история и готовые документы помогут точнее
                  показать ограничения маршрутов.
                </AlertDescription>
              </Alert>
              <Summary draft={values} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={previousStep}
          disabled={step === 0}
        >
          <ArrowLeft data-icon="inline-start" />
          Назад
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={nextStep}>
            Дальше
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button type="button" onClick={saveProfileForResults}>
            Показать маршруты
          </Button>
        )}
      </div>
    </form>
  )
}

function ReadinessPanel({
  description,
  hints,
  label,
  score,
}: {
  description: string
  hints: { tone: ReadinessTone; title: string; description: string }[]
  label: string
  score: number
}) {
  return (
    <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold">
              Готовность к подбору
            </h2>
            <p className="text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
          <span className="w-fit rounded-md border bg-background px-2 py-1 text-sm font-medium">
            {score}/100 · {label}
          </span>
        </div>
        <Progress value={score} aria-label="Готовность анкеты к подбору" />
        <div className="grid gap-2 md:grid-cols-2">
          {hints.map((hint) => (
            <div
              key={`${hint.tone}-${hint.title}`}
              className={cn(
                "rounded-md border p-3 text-sm",
                readinessHintStyles[hint.tone]
              )}
            >
              <p className="font-medium">{hint.title}</p>
              <p className="mt-1 leading-5 text-muted-foreground">
                {hint.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const readinessHintStyles: Record<ReadinessTone, string> = {
  positive: "border-emerald-200 bg-emerald-50/70",
  warning: "border-amber-200 bg-amber-50/70",
  risk: "border-rose-200 bg-rose-50/70",
  neutral: "border-border bg-background",
}

function safelyParseDraft(raw: string) {
  try {
    return questionnaireDraftSchema.safeParse(JSON.parse(raw))
  } catch {
    return questionnaireDraftSchema.safeParse(null)
  }
}

function Choice({
  checked,
  hint,
  id,
  label,
  name,
  onSelect,
  value,
}: {
  checked: boolean
  hint?: string
  id: string
  label: string
  name: string
  onSelect: () => void
  value: string
}) {
  return (
    <label
      id={id}
      data-choice-id={id}
      data-checked={checked}
      className="flex w-full cursor-pointer items-start gap-3 rounded-md border bg-background p-3 text-left has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="sr-only"
        onChange={onSelect}
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-primary" : "border-input"
        )}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {hint && (
          <span
            id={`${id}-hint`}
            className="text-sm leading-5 text-muted-foreground"
          >
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}

function ToggleChoice({
  checked,
  label,
  onToggle,
}: {
  checked: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <label
      className="flex w-full cursor-pointer items-center gap-3 rounded-md border bg-background p-3 text-left text-sm has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
      data-checked={checked}
    >
      <input
        type="checkbox"
        checked={checked}
        className="sr-only"
        onChange={onToggle}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input"
        )}
      >
        {checked && <Check className="size-3" />}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </label>
  )
}

function CheckboxChoice({
  checked,
  label,
  onToggle,
}: {
  checked: boolean
  label: string
  onToggle: () => void
}) {
  return <ToggleChoice checked={checked} label={label} onToggle={onToggle} />
}

function RadioField<
  TName extends
    | "departureWindow"
    | "stayDuration"
    | "passportStatus"
    | "visaHistory"
    | "schengenHistory"
    | "monthlyIncomeLevel"
    | "savingsLevel"
    | "translationReadiness",
>({
  control,
  label,
  name,
  options,
  setValue,
}: {
  control: ReturnType<typeof useForm<QuestionnaireDraft>>["control"]
  label: string
  name: TName
  options: { value: NonNullable<QuestionnaireDraft[TName]>; label: string }[]
  setValue: ReturnType<typeof useForm<QuestionnaireDraft>>["setValue"]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">{label}</legend>
          <div role="radiogroup" className="grid gap-3">
            {options.map((option) => {
              return (
                <Choice
                  key={String(option.value)}
                  id={`${name}-${option.value}`}
                  name={name}
                  value={String(option.value)}
                  checked={field.value === option.value}
                  label={option.label}
                  onSelect={() =>
                    setValue(
                      name,
                      option.value as PathValue<QuestionnaireDraft, TName>,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      }
                    )
                  }
                />
              )
            })}
          </div>
        </fieldset>
      )}
    />
  )
}

function BooleanRadioField<TName extends "hasProvableIncome">({
  control,
  label,
  name,
  setValue,
}: {
  control: ReturnType<typeof useForm<QuestionnaireDraft>>["control"]
  label: string
  name: TName
  setValue: ReturnType<typeof useForm<QuestionnaireDraft>>["setValue"]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">{label}</legend>
          <div role="radiogroup" className="grid gap-3">
            {[
              { value: true, label: "Да, могу подтвердить" },
              { value: false, label: "Нет или пока не уверен" },
            ].map((option) => {
              return (
                <Choice
                  key={String(option.value)}
                  id={`${name}-${option.value}`}
                  name={name}
                  value={String(option.value)}
                  checked={field.value === option.value}
                  label={option.label}
                  onSelect={() =>
                    setValue(
                      name,
                      option.value as PathValue<QuestionnaireDraft, TName>,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      }
                    )
                  }
                />
              )
            })}
          </div>
        </fieldset>
      )}
    />
  )
}

function BooleanField<TName extends keyof QuestionnaireDraft>({
  control,
  label,
  name,
}: {
  control: ReturnType<typeof useForm<QuestionnaireDraft>>["control"]
  label: string
  name: TName
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <ToggleChoice
          checked={Boolean(field.value)}
          label={label}
          onToggle={() => field.onChange(!field.value)}
        />
      )}
    />
  )
}

function Summary({ draft }: { draft: QuestionnaireDraft }) {
  const result = finalizeQuestionnaireDraft(draft)

  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Анкета пока не готова</AlertTitle>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    )
  }

  const rows = summarizeProfile(result.data).slice(0, 6)

  return (
    <div className="flex flex-col rounded-lg border">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className="grid gap-1 p-3 text-sm sm:grid-cols-[180px_1fr]"
        >
          <span className="font-medium">{row.label}</span>
          <span className="text-muted-foreground">{row.value}</span>
          {index < rows.length - 1 && <Separator className="sm:col-span-2" />}
        </div>
      ))}
    </div>
  )
}

function getStepTitle(step: number): string {
  return [
    "Какую задачу решаем?",
    "Когда и на какой срок вы планируете уехать?",
    "Кто едет вместе с вами?",
    "Какие финансовые основания можно подтвердить?",
    "Что уже понятно по документам и визовой истории?",
    "Проверьте ответы перед расчетом",
  ][step]
}

function getStepDescription(step: number): string {
  return [
    "Страна не является первым фильтром: сначала фиксируем цель и ограничения.",
    "Сроки влияют на то, нужен ли только въезд или уже отдельный статус.",
    "Семья, дети и животные меняют документы и сложность маршрута.",
    "Доход, договор и бизнес-основание отсеивают неподходящие маршруты.",
    "Эти ответы помогают показать риски заранее, а не в конце подготовки.",
    "После расчета вы увидите страны, маршруты, документы, сроки и источники.",
  ][step]
}
