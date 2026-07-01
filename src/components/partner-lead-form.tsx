"use client"

import { FormEvent, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { CheckCircle2, Send } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type PartnerLeadFormState = {
  organizationName: string
  contactName: string
  contact: string
  website: string
  countries: string
  services: string
  message: string
  consent: boolean
  websiteUrl: string
}

type PartnerLeadFormErrors = Partial<
  Record<keyof PartnerLeadFormState, string>
>

const initialForm: PartnerLeadFormState = {
  organizationName: "",
  contactName: "",
  contact: "",
  website: "",
  countries: "",
  services: "",
  message: "",
  consent: false,
  websiteUrl: "",
}

const fieldIds: Record<keyof PartnerLeadFormState, string> = {
  organizationName: "partner-organization",
  contactName: "partner-contact-name",
  contact: "partner-contact",
  website: "partner-website",
  countries: "partner-countries",
  services: "partner-services",
  message: "partner-message",
  consent: "partner-consent",
  websiteUrl: "partner-website-url",
}

const validationFocusOrder: (keyof PartnerLeadFormState)[] = [
  "organizationName",
  "contactName",
  "contact",
  "countries",
  "services",
  "message",
  "consent",
  "websiteUrl",
]

export function PartnerLeadForm() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [error, setError] = useState("")

  const errors = useMemo(() => validatePartnerLeadForm(form), [form])
  const visibleErrors = hasTriedSubmit ? errors : {}
  const canSubmit = Object.keys(errors).length === 0

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasTriedSubmit(true)
    setError("")

    if (!canSubmit) {
      setError("Заполните обязательные поля и подтвердите согласие.")
      focusFirstInvalidField(errors)
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/partner-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        setError("Не удалось отправить заявку. Попробуйте еще раз.")
        return
      }

      setSubmitted(true)
      setHasTriedSubmit(false)
      setForm(initialForm)
    } catch {
      setError("Не удалось отправить заявку. Проверьте соединение.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
        <CheckCircle2 data-icon="inline-start" />
        <AlertTitle>Заявка отправлена</AlertTitle>
        <AlertDescription>
          Мы получили обращение и свяжемся с вами по указанному контакту после
          ручной проверки.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold">Оставить заявку</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Подойдет email, Telegram, телефон или официальный канал связи.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Компания или специалист" htmlFor="partner-organization">
          <Input
            id="partner-organization"
            value={form.organizationName}
            onChange={(event) => update("organizationName", event.target.value)}
            placeholder="Название компании"
            autoComplete="organization"
            aria-invalid={Boolean(visibleErrors.organizationName)}
            aria-describedby={
              visibleErrors.organizationName
                ? "partner-organization-error"
                : undefined
            }
          />
          <FieldError
            id="partner-organization-error"
            message={visibleErrors.organizationName}
          />
        </Field>
        <Field label="Контактное лицо" htmlFor="partner-contact-name">
          <Input
            id="partner-contact-name"
            value={form.contactName}
            onChange={(event) => update("contactName", event.target.value)}
            placeholder="Имя"
            autoComplete="name"
            aria-invalid={Boolean(visibleErrors.contactName)}
            aria-describedby={
              visibleErrors.contactName
                ? "partner-contact-name-error"
                : undefined
            }
          />
          <FieldError
            id="partner-contact-name-error"
            message={visibleErrors.contactName}
          />
        </Field>
      </div>

      <Field label="Способ связи" htmlFor="partner-contact">
        <Input
          id="partner-contact"
          value={form.contact}
          onChange={(event) => update("contact", event.target.value)}
          placeholder="Email, Telegram, телефон или ссылка"
          autoComplete="email"
          aria-invalid={Boolean(visibleErrors.contact)}
          aria-describedby={
            visibleErrors.contact ? "partner-contact-error" : undefined
          }
        />
        <FieldError
          id="partner-contact-error"
          message={visibleErrors.contact}
        />
      </Field>

      <Field
        label="Сайт или официальный канал"
        htmlFor="partner-website"
        required={false}
      >
        <Input
          id="partner-website"
          value={form.website}
          onChange={(event) => update("website", event.target.value)}
          placeholder="Необязательно"
          autoComplete="url"
        />
      </Field>

      <div className="hidden">
        <Label htmlFor="partner-website-url">Сайт</Label>
        <Input
          id="partner-website-url"
          tabIndex={-1}
          value={form.websiteUrl}
          onChange={(event) => update("websiteUrl", event.target.value)}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Страны" htmlFor="partner-countries">
          <Textarea
            id="partner-countries"
            value={form.countries}
            onChange={(event) => update("countries", event.target.value)}
            placeholder="Например: Сербия, Армения, Турция"
            aria-invalid={Boolean(visibleErrors.countries)}
            aria-describedby={
              visibleErrors.countries ? "partner-countries-error" : undefined
            }
          />
          <FieldError
            id="partner-countries-error"
            message={visibleErrors.countries}
          />
        </Field>
        <Field label="Чем помогаете" htmlFor="partner-services">
          <Textarea
            id="partner-services"
            value={form.services}
            onChange={(event) => update("services", event.target.value)}
            placeholder="Визы, ВНЖ, документы, налоги, адаптация"
            aria-invalid={Boolean(visibleErrors.services)}
            aria-describedby={
              visibleErrors.services ? "partner-services-error" : undefined
            }
          />
          <FieldError
            id="partner-services-error"
            message={visibleErrors.services}
          />
        </Field>
      </div>

      <Field label="Комментарий" htmlFor="partner-message">
        <Textarea
          id="partner-message"
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="Какой формат сотрудничества вам интересен и по каким направлениям вы готовы принимать обращения."
          aria-invalid={Boolean(visibleErrors.message)}
          aria-describedby={
            visibleErrors.message ? "partner-message-error" : undefined
          }
        />
        <FieldError
          id="partner-message-error"
          message={visibleErrors.message}
        />
      </Field>

      <div className="flex items-start gap-3 text-sm leading-6">
        <input
          id="partner-consent"
          type="checkbox"
          checked={form.consent}
          onChange={(event) => update("consent", event.target.checked)}
          aria-label="Согласие на обработку заявки партнера"
          aria-invalid={Boolean(visibleErrors.consent)}
          aria-describedby={
            visibleErrors.consent ? "partner-consent-error" : undefined
          }
          className="mt-1 size-4 shrink-0 accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
        <Label
          htmlFor="partner-consent"
          className="cursor-pointer items-start text-sm leading-6 font-normal"
        >
          Я согласен на обработку данных из этой формы для связи по
          сотрудничеству. Подробнее:{" "}
          <Link
            className="underline-offset-4 hover:underline"
            href="/legal/privacy"
            target="_blank"
          >
            политика обработки персональных данных
          </Link>
          .
        </Label>
      </div>
      <FieldError
        id="partner-consent-error"
        message={visibleErrors.consent}
      />

      {error && (
        <Alert variant="destructive" aria-live="polite">
          <AlertTitle>Заявку пока нельзя отправить</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitting}>
        <Send data-icon="inline-start" />
        {submitting ? "Отправляем..." : "Отправить"}
      </Button>
    </form>
  )

  function update<TKey extends keyof PartnerLeadFormState>(
    key: TKey,
    value: PartnerLeadFormState[TKey]
  ) {
    setError("")
    setForm((current) => ({ ...current, [key]: value }))
  }
}

function Field({
  children,
  htmlFor,
  label,
  required = true,
}: {
  children: ReactNode
  htmlFor: string
  label: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  )
}

function FieldError({
  id,
  message,
}: {
  id: string
  message?: string
}) {
  if (!message) {
    return null
  }

  return (
    <p id={id} className="text-sm leading-5 text-destructive">
      {message}
    </p>
  )
}

function validatePartnerLeadForm(
  form: PartnerLeadFormState
): PartnerLeadFormErrors {
  const errors: PartnerLeadFormErrors = {}

  if (form.organizationName.trim().length < 2) {
    errors.organizationName = "Укажите компанию или имя специалиста."
  }

  if (form.contactName.trim().length < 2) {
    errors.contactName = "Укажите контактное лицо."
  }

  if (form.contact.trim().length < 4) {
    errors.contact = "Укажите email, Telegram, телефон или ссылку."
  }

  if (form.countries.trim().length < 2) {
    errors.countries = "Укажите хотя бы одну страну."
  }

  if (form.services.trim().length < 2) {
    errors.services = "Коротко опишите, с чем вы помогаете."
  }

  if (form.message.trim().length < 10) {
    errors.message = "Добавьте комментарий от 10 символов."
  }

  if (!form.consent) {
    errors.consent = "Подтвердите согласие на обработку заявки."
  }

  if (form.websiteUrl.trim().length > 0) {
    errors.websiteUrl = "Не удалось отправить заявку. Попробуйте еще раз."
  }

  return errors
}

function focusFirstInvalidField(errors: PartnerLeadFormErrors) {
  const firstInvalidField = validationFocusOrder.find((field) => errors[field])

  if (!firstInvalidField) {
    return
  }

  window.requestAnimationFrame(() => {
    document.getElementById(fieldIds[firstInvalidField])?.focus()
  })
}
