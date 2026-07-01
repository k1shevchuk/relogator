import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  ClipboardList,
  FileText,
  LogOut,
  Route,
  UserCircle,
} from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AuthFormMessage,
  readAuthSearchParams,
} from "@/features/auth/auth-form-message"
import { signOutAction } from "@/features/auth/actions"
import { SupabaseSetupNotice } from "@/features/auth/supabase-setup-notice"
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server"

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    confirmed?: string | string[]
    error?: string | string[]
    message?: string | string[]
  }>
}) {
  const params = await searchParams
  const { error, message } = await readAuthSearchParams(Promise.resolve(params))
  const authMessage =
    message ??
    (readFirstParam(params.confirmed) === "1"
      ? "Email подтвержден. Аккаунт готов к работе."
      : undefined)

  if (!isSupabaseConfigured()) {
    return <AccountShell body={<SupabaseSetupNotice />} />
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AccountShell
        body={
          <section className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex max-w-2xl flex-col gap-4">
              <div className="flex items-start gap-3">
                <UserCircle className="mt-1 size-5 text-primary" />
                <div className="flex flex-col gap-2">
                  <h1 className="font-heading text-2xl font-semibold">
                    Личный кабинет
                  </h1>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Войдите, чтобы открыть пошаговые планы, сохранить маршруты и
                    видеть обращения к специалистам в одном месте.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/auth/login">
                    Войти
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/questionnaire">Начать подбор</Link>
                </Button>
              </div>
            </div>
          </section>
        }
      />
    )
  }

  const [profileResult, plansResult, requestsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("saved_route_plans")
      .select("id, route_id, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("specialist_requests")
      .select("id, route_title, country_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const role = profileResult.data?.role ?? "user"
  const plans = plansResult.data ?? []
  const requests = requestsResult.data ?? []

  return (
    <AccountShell
      body={
        <div className="flex flex-col gap-5">
          <AuthFormMessage error={error} message={authMessage} />
          <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <UserCircle className="mt-0.5 size-5 text-primary" />
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-2xl font-semibold">
                  Личный кабинет
                </h1>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{user.email}</span>
                  {role === "admin" && (
                    <Badge variant="outline">Администратор</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {role === "admin" && (
                <Button asChild variant="outline">
                  <Link href="/admin">Управление сервисом</Link>
                </Button>
              )}
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  <LogOut data-icon="inline-start" />
                  Выйти
                </Button>
              </form>
            </div>
          </section>

          <div className="grid gap-3 md:grid-cols-3">
            <ActionCard
              href="/questionnaire"
              icon={<ClipboardList />}
              title="Обновить анкету"
              text="Уточнить цель, сроки, документы и получить новый подбор."
            />
            <ActionCard
              href="/results"
              icon={<Route />}
              title="Открыть маршруты"
              text="Вернуться к результатам последней анкеты и продолжить выбор."
            />
            <ActionCard
              href="/specialist-requests"
              icon={<FileText />}
              title="Обращения"
              text="Посмотреть вопросы, которые вы отправляли специалистам."
            />
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            <RecordList
              actionHref="/results"
              actionText="К маршрутам"
              empty="Сохраненных маршрутов пока нет."
              rows={plans.map((item) => ({
                id: item.id,
                title: item.route_id,
                description: item.notes
                  ? `${item.notes}, ${formatDate(item.created_at)}`
                  : `Сохранен: ${formatDate(item.created_at)}`,
              }))}
              title="Сохраненные планы"
            />
            <RecordList
              actionHref="/specialist-requests"
              actionText="Открыть обращения"
              title="Заявки специалистам"
              empty="Заявок пока нет."
              rows={requests.map((item) => ({
                id: item.id,
                title: `${item.country_name}: ${item.route_title}`,
                description: `${requestStatusLabels[item.status] ?? item.status}, ${formatDate(item.created_at)}`,
              }))}
            />
          </section>
        </div>
      }
    />
  )
}

function AccountShell({ body }: { body: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {body}
      </main>
    </>
  )
}

function ActionCard({
  href,
  icon,
  text,
  title,
}: {
  href: string
  icon: ReactNode
  text: string
  title: string
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-36 flex-col justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground [&_svg]:size-5">
        {icon}
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-heading text-base font-medium">{title}</span>
        <span className="text-sm leading-6 text-muted-foreground">{text}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function RecordList({
  actionHref,
  actionText,
  empty,
  rows,
  title,
}: {
  actionHref: string
  actionText: string
  empty: string
  rows: { id: string; title: string; description: string }[]
  title: string
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <ul className="flex flex-col gap-3 text-sm">
            {rows.map((row) => (
              <li key={row.id} className="rounded-md border p-3">
                <p className="font-medium">{row.title}</p>
                <p className="text-muted-foreground">{row.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-3 rounded-md border bg-background p-3">
            <p className="text-sm leading-6 text-muted-foreground">{empty}</p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href={actionHref}>{actionText}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function readFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

const requestStatusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  closed: "Закрыта",
  rejected: "Отклонена",
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
