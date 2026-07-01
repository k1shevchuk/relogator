"use client"

import { FormEvent, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { CheckCircle2, Send } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

export function PartnerLeadForm() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const canSubmit = useMemo(
    () =>
      form.organizationName.trim().length >= 2 &&
      form.contactName.trim().length >= 2 &&
      form.contact.trim().length >= 4 &&
      form.countries.trim().length >= 2 &&
      form.services.trim().length >= 2 &&
      form.message.trim().length >= 10 &&
      form.consent &&
      form.websiteUrl.trim().length === 0,
    [form]
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!canSubmit) {
      setError("Заполните обязательные поля и подтвердите согласие.")
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
        <h2 className="font-heading text-xl font-semibold">
          Оставить заявку
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Подойдет email, Telegram, телефон или официальный канал связи.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Компания или специалист" htmlFor="partner-organization">
          <Input
            id="partner-organization"
            value={form.organizationName}
            onChange={(event) =>
              update("organizationName", event.target.value)
            }
            placeholder="Название компании"
            autoComplete="organization"
          />
        </Field>
        <Field label="Контактное лицо" htmlFor="partner-contact-name">
          <Input
            id="partner-contact-name"
            value={form.contactName}
            onChange={(event) => update("contactName", event.target.value)}
            placeholder="Имя"
            autoComplete="name"
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
        />
      </Field>

      <Field label="Сайт или официальный канал" htmlFor="partner-website">
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
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Страны" htmlFor="partner-countries">
          <Textarea
            id="partner-countries"
            value={form.countries}
            onChange={(event) => update("countries", event.target.value)}
            placeholder="Например: Сербия, Армения, Турция"
          />
        </Field>
        <Field label="Чем помогаете" htmlFor="partner-services">
          <Textarea
            id="partner-services"
            value={form.services}
            onChange={(event) => update("services", event.target.value)}
            placeholder="Визы, ВНЖ, документы, налоги, адаптация"
          />
        </Field>
      </div>

      <Field label="Комментарий" htmlFor="partner-message">
        <Textarea
          id="partner-message"
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="Какой формат сотрудничества вам интересен и по каким направлениям вы готовы принимать обращения."
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
        <Checkbox
          checked={form.consent}
          onCheckedChange={(checked) => update("consent", Boolean(checked))}
          aria-label="Согласие на обработку заявки партнера"
        />
        <span>
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
        </span>
      </label>

      {error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {error}
        </p>
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
    setForm((current) => ({ ...current, [key]: value }))
  }
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
