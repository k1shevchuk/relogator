"use client"

import { FormEvent, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { CheckCircle2, Send, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  saveSpecialistRequest,
  type StoredSpecialistRequest,
} from "@/features/specialist-requests/request-storage"

type SpecialistRequestFormProps = {
  countryName: string
  routeId: string
  routeTitle: string
  triggerLabel?: string
}

export function SpecialistRequestForm({
  countryName,
  routeId,
  routeTitle,
  triggerLabel = "Задать вопрос специалисту",
}: SpecialistRequestFormProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    contact: "",
    question: "",
    consent: false,
  })

  const canSubmit = useMemo(
    () =>
      form.name.trim().length > 1 &&
      form.contact.trim().length > 3 &&
      form.question.trim().length > 9 &&
      form.consent,
    [form]
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!canSubmit) {
      setError(
        "Заполните имя, способ связи, вопрос и согласие на передачу данных."
      )
      return
    }

    const request: StoredSpecialistRequest = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: form.name.trim(),
      contact: form.contact.trim(),
      countryName,
      routeId,
      routeTitle,
      question: form.question.trim(),
      consent: form.consent,
    }

    saveSpecialistRequest(request)

    setSubmitted(true)
    setOpen(false)
  }

  if (submitted) {
    return (
      <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
        <CheckCircle2 data-icon="inline-start" />
        <AlertTitle>Заявка сохранена</AlertTitle>
        <AlertDescription>
          Это заявка на консультацию, не гарантия результата. Сейчас она
          сохранена локально в браузере, без отправки в базу.
        </AlertDescription>
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/specialist-requests">Открыть список заявок</Link>
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!open ? (
        <Button variant="outline" type="button" onClick={() => setOpen(true)}>
          {triggerLabel}
        </Button>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-lg border bg-background p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-base font-medium">
                Заявка специалисту
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Это консультационная заявка. Она не означает гарантию въезда,
                ВНЖ или решения органа страны.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Закрыть форму"
            >
              <X />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Имя" htmlFor={`${routeId}-request-name`}>
              <Input
                id={`${routeId}-request-name`}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Как к вам обращаться"
              />
            </Field>
            <Field label="Способ связи" htmlFor={`${routeId}-request-contact`}>
              <Input
                id={`${routeId}-request-contact`}
                value={form.contact}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contact: event.target.value,
                  }))
                }
                placeholder="Email, Telegram или телефон"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Страна" htmlFor={`${routeId}-request-country`}>
              <Input
                id={`${routeId}-request-country`}
                value={countryName}
                readOnly
              />
            </Field>
            <Field label="Маршрут" htmlFor={`${routeId}-request-route`}>
              <Input
                id={`${routeId}-request-route`}
                value={routeTitle}
                readOnly
              />
            </Field>
          </div>

          <Field label="Вопрос" htmlFor={`${routeId}-request-question`}>
            <Textarea
              id={`${routeId}-request-question`}
              value={form.question}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  question: event.target.value,
                }))
              }
              placeholder="Опишите, что хотите проверить: документы, сроки, семью, работу, бизнес."
            />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <Checkbox
              checked={form.consent}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  consent: Boolean(checked),
                }))
              }
              aria-label="Согласие на передачу данных специалисту"
            />
            <span>
              Я согласен передать ответы анкеты, выбранную страну, маршрут и
              вопрос специалисту для ответа по консультации.
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit">
            <Send data-icon="inline-start" />
            Сохранить заявку
          </Button>
        </form>
      )}
    </div>
  )
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode
  htmlFor: string
  label: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
